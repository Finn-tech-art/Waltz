"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type EventPropGetter } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales: { "en-US": enUS },
});

type BringUpRow = {
  id: string;
  event_type: string;
  title: string;
  due_date: string;
  file_id: string | null;
  status: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  eventType: string;
  fileId: string | null;
};

export function CalendarView({ events }: { events: BringUpRow[] }) {
  const router = useRouter();

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      events.map((e) => {
        const date = new Date(e.due_date);
        return {
          id: e.id,
          title: e.title,
          start: date,
          end: date,
          eventType: e.event_type,
          fileId: e.file_id,
        };
      }),
    [events]
  );

  const eventPropGetter: EventPropGetter<CalendarEvent> = (event) => ({
    style: {
      backgroundColor: event.eventType === "court_date" ? "#dc2626" : "#2563eb",
      borderColor: "transparent",
    },
  });

  return (
    <div className="rounded-lg border p-4" style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventPropGetter}
        onSelectEvent={(event) => {
          if (event.fileId) router.push(`/files/${event.fileId}`);
        }}
      />
    </div>
  );
}
