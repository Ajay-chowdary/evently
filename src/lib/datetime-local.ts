export function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function splitDatetimeLocal(value: string): { date: string; time: string } {
  if (!value.trim()) return { date: "", time: "" };
  const [date, timePart] = value.split("T");
  if (!date) return { date: "", time: "" };
  const time = timePart?.slice(0, 5) ?? "";
  return { date, time };
}

export function joinDatetimeLocal(date: string, time: string): string {
  if (!date.trim()) return "";
  const t = time.trim().length >= 4 ? time.trim().slice(0, 5) : "00:00";
  return `${date.trim()}T${t}`;
}
