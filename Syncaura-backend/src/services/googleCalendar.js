import { google } from "googleapis";
import { getCalendarClient } from "../utils/googleAuth.js";

export const createCalendarEvent = async ({
  tokens,
  title,
  description,
  startTime,
  endTime,
}) => {

  const calendar = getCalendarClient(tokens);

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  return event.data;
};

export const updateCalendarEvent = async (
  eventId,
  {
     tokens,
  title,
  description,
  startTime,
  endTime,
  }
) => {

  const auth = getCalendarClient(tokens);

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const event = await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: {
      summary: title,
      description,
      start: {
        dateTime: startTime,
      },
      end: {
        dateTime: endTime,
      },
    },
  });

  return event.data;
};

export const deleteCalendarEvent = async (eventId, tokens) => {

  const calendar = getCalendarClient(tokens);

  
}