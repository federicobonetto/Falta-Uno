const MATCH_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function argentinaDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MATCH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
}

export function matchHasStarted(matchDate: string, matchTime: string, now = new Date()) {
  const current = argentinaDateTime(now);
  return matchDate < current.date || (matchDate === current.date && matchTime <= current.time);
}
