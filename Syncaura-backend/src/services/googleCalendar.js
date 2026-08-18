import { google } from "googleapis";
import { getCalendarClient } from "../utils/googleAuth.js";

export const createCalendarEvent = async ({
  tokens,
  title,
  description,
  startTime,
  endTime,
}) => {
  try {
    const calendar = getCalendarClient(tokens);

    const event = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        description,
        start: {
          dateTime: startTime,
        },
        end: {
          dateTime: endTime,
        },
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
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw new Error("Failed to create Google Calendar event.");
  }
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
  try {
    const calendar = getCalendarClient(tokens);

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
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    throw new Error("Failed to update Google Calendar event.");
  }
};

export const deleteCalendarEvent = async (eventId, tokens) => {
  try {
    const calendar = getCalendarClient(tokens);

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    return {
      success: true,
      message: "Google Calendar event deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    throw new Error("Failed to delete Google Calendar event.");
  }
};