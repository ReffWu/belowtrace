// Minimal iCalendar (RFC 5545) export for deadline reminders. Runs in the browser; nothing is sent anywhere.
const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function deadlineIcs({ title, detail, due, url, alarms = ["-P3D", "-P1D"], prefix = "Deadline: " }: { title: string; detail: string; due: Date; url?: string; alarms?: string[]; prefix?: string }) {
  // A 30-minute block ending at the deadline, with alarms 3 days and 1 day before unless told otherwise.
  const start = new Date(due.getTime() - 30 * 60 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BelowTrace Detroit//EN",
    "BEGIN:VEVENT",
    `UID:${due.getTime()}-${title.replace(/\W+/g, "-").toLowerCase()}@belowtrace`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(due)}`,
    `SUMMARY:${escapeText(`${prefix}${title}`)}`,
    `DESCRIPTION:${escapeText(detail + (url ? `\n${url}` : ""))}`,
    ...(url ? [`URL:${url}`] : []),
    ...alarms.flatMap((trigger) => [
      "BEGIN:VALARM",
      `TRIGGER:${trigger}`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(title)}`,
      "END:VALARM",
    ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
