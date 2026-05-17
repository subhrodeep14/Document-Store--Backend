/*
──────────────────────────────────────
DATE LOCK
──────────────────────────────────────
*/

const isDateLocked = (
  value
) => {
  if (!value)
    return false;

  const date =
    new Date(value);

  const entryDate =
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      )
    );

  const oneYearAgo =
    new Date();

  oneYearAgo.setUTCFullYear(
    oneYearAgo.getUTCFullYear() -
      1
  );

  oneYearAgo.setUTCHours(
    0,
    0,
    0,
    0
  );

  return (
    entryDate <
    oneYearAgo
  );
};

/*
──────────────────────────────────────
FORMAT YYYY-MM-DD
──────────────────────────────────────
*/

const formatDate = (
  value
) => {
  if (!value)
    return "";

  const d =
    new Date(value);

  const year =
    d.getUTCFullYear();

  const month = String(
    d.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/*
──────────────────────────────────────
DISPLAY DATE
6 May 2026
──────────────────────────────────────
*/

const formatDisplayDate =
  (value) => {
    if (!value)
      return "";

    const d =
      new Date(value);

    const day = String(
      d.getUTCDate()
    );

    const month =
      d.toLocaleString(
        "en-IN",
        {
          month: "short",
          timeZone: "UTC",
        }
      );

    const year =
      d.getUTCFullYear();

    return `${day} ${month} ${year}`;
  };

/*
──────────────────────────────────────
DISPLAY SHORT
──────────────────────────────────────
*/

const formatDateTime =
  (value) => {
    return formatDisplayDate(
      value
    );
  };

module.exports = {
  isDateLocked,

  formatDate,

  formatDateTime,

  formatDisplayDate,
};