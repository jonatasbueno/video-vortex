export function toSnakeCase(input: string, maxLength = 120): string {
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const base = normalized || 'video';
  return base.slice(0, maxLength).replace(/_$/, '');
}

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}` +
    `${pad(date.getHours())}` +
    `${pad(date.getMinutes())}` +
    `${pad(date.getSeconds())}`
  );
}

export function buildFilenameBase(title: string, date: Date = new Date()): string {
  return `${formatTimestamp(date)}_${toSnakeCase(title)}`;
}
