export const norwayTimezone = { timeZone: "Europe/Oslo" };
export const countryThatUsesIsoStandardAsLocalePraiseBeTheSwedes = "sv-SE";

export const getIsoDateInNorwegianTimezone = (date = new Date()) =>
  date.toLocaleString(
    countryThatUsesIsoStandardAsLocalePraiseBeTheSwedes,
    norwayTimezone
  );