export const parseDate = (dateStr: string) => {
  return new Date(dateStr.replace(/\//g, "-"));
};
