"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Since users need to input formats of dates/times, and we didn't want them to enter everything twice, we made this map.
 * Users will always input PHP format, which will then be converted into JS.
 * On the JS side, we use fecha library (https://github.com/taylorhakes/fecha).
 */

/**
 * Copied from http://php.net/manual/en/function.date.php.
 * If undefined, it means we don't have an adequate replacement in JS, and thus is not supported.
 * Can be improved in the future.
 */
exports.default = {
    //   JS    Description                                      Example
    d: ["DD", "Day of the month, 2 digits with leading zeros", "01 to 31"],
    D: ["ddd", "A textual representation of a day, three letters", "Mon through Sun"],
    j: ["D", "Day of the month without leading zeros", "1 to 31"],
    l: [
        "dddd",
        "(lowercase L) A full textual representation of the day of the week",
        "Sunday through Saturday"
    ],
    N: [
        undefined,
        "ISO-8601 numeric representation of the day of the week (added in PHP 5.1.0)",
        "1 (for Monday) through 7 (for Sunday)"
    ],
    S: [
        "Do",
        "English ordinal suffix for the day of the month, 2 characters",
        "st, nd, rd or th. Works well with j"
    ],
    w: [
        "d",
        "Numeric representation of the day of the week",
        "0 (for Sunday) through 6 (for Saturday)"
    ],
    z: [undefined, "The day of the year (starting from 0)", "0 through 365"],
    // Week	---	---
    W: [
        undefined,
        "ISO-8601 week number of year, weeks starting on Monday",
        "Example: 42 (the 42nd week in the year)"
    ],
    // ['/ Month	---	---
    F: [
        "",
        "A full textual representation of a month, such as January or March	",
        "January through December"
    ],
    m: ["MM", "Numeric representation of a month, with leading zeros", "01 through 12"],
    M: ["MMM", "A short textual representation of a month, three letters", "Jan through Dec"],
    n: ["M", "Numeric representation of a month, without leading zeros", "1 through 12"],
    t: [undefined, "Number of days in the given month	", "28 through 31"],
    // Year	---	---
    L: [undefined, "Whether it's a leap year", "1 if it is a leap year, 0 otherwise."],
    o: [
        undefined,
        "ISO-8601 week-numbering year. This has the same value as Y, except that if the ISO week number (W) belongs to the previous or next year, that year is used instead. (added in PHP 5.1.0)",
        "Examples: 1999 or 2003"
    ],
    Y: ["YYYY", "A full numeric representation of a year, 4 digits", "Examples: 1999 or 2003"],
    y: ["YY", "A two digit representation of a ", "Examples: 99 or 03"],
    // Time	---	---
    a: ["a", "Lowercase Ante meridiem and Post meridiem", "am or pm"],
    A: ["A", "Uppercase Ante meridiem and Post meridiem", "AM or PM"],
    B: [undefined, "Swatch Internet time", "000 through 999"],
    g: ["h", "12-hour format of an hour without leading zeros", "1 through 12"],
    G: ["H", "24-hour format of an hour without leading zeros", "0 through 23"],
    h: ["hh", "12-hour format of an hour with leading zeros", "01 through 12"],
    H: ["HH", "24-hour format of an hour with leading zeros", "00 through 23"],
    i: ["mm", "Minutes with leading zeros", "00 to 59"],
    s: ["ss", "Seconds, with leading zeros", "00 through 59"],
    u: [
        undefined,
        "Microseconds (added in PHP 5.2.2). Note that date() will always generate 000000 since it takes an integer parameter, whereas DateTime::format() does support microseconds if DateTime was created with microseconds.",
        "Example: 654321"
    ],
    v: [
        undefined,
        "Milliseconds (added in PHP 7.0.0). Same note applies as for u.",
        "Example: 654"
    ],
    // Timezone	---	---
    e: [
        undefined,
        "Timezone identifier (added in PHP 5.1.0)",
        "Examples: UTC, GMT, Atlantic/Azores"
    ],
    I: [
        undefined,
        "(capital i) Whether or not the date is in daylight saving time	",
        "1 if Daylight Saving Time, 0 otherwise."
    ],
    O: ["ZZ", "Difference to Greenwich time (GMT) in hours", "Example: +0200"],
    P: [
        undefined,
        "Difference to Greenwich time (GMT) with colon between hours and minutes (added in PHP 5.1.3)",
        "Example: +02:00"
    ],
    T: [undefined, "Timezone abbreviation", "Examples: EST, MDT ..."],
    Z: [
        undefined,
        "Timezone offset in seconds. The offset for timezones west of UTC is always negative, and for those east of UTC is always positive.	",
        "-43200 through 50400"
    ],
    // Full Date/Time	---	---
    c: [undefined, "ISO 8601 date (added in PHP 5)	", "2004-02-12T15:19:21+00:00"],
    r: [undefined, "» RFC 2822 formatted date", "Example: Thu, 21 Dec 2000 16:01:07 +0200"],
    U: [undefined, "Seconds since the Unix Epoch (January 1 1970 00:00:00 GMT)	", "See also time()"]
};
//# sourceMappingURL=PhpJsMap.js.map
