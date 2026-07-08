import { google } from "googleapis";
import { getCalendarClient } from "../utils/googleAuth.js";

export const createCalendarEvent = async ({
  title,
  description,
  startTime,
  endTime,
}) => {

  const calendar = getCalendarClient();

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
    title,
    description,
    startTime,
    endTime,
  }
) => {

  const auth = getCalendarClient();

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

export const deleteCalendarEvent = async (eventId) => {

  const auth = getCalendarClient();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });

};