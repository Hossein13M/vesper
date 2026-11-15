function vesperInRange(date, start, end) {
  const startMinutes = minutesFromClock(start);
  const endMinutes = minutesFromClock(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return true;
  }

  const now = date.getHours() * 60 + date.getMinutes();
  if (startMinutes < endMinutes) {
    return now >= startMinutes && now < endMinutes;
  }
  return now >= startMinutes || now < endMinutes;
}

function minutesFromClock(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
