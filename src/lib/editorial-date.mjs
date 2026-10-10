/** AHC review dates are calendar dates in Queensland, including before midnight UTC. */
export function editorialDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
