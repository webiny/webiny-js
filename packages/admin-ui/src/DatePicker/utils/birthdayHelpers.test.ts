import { describe, expect, it } from "vitest";
import {
    birthdayYears,
    daysInMonth,
    formatBirthdayValue,
    isDayDisabled,
    isMonthDisabled,
    isYearDisabled,
    nextBirthdayStep,
    parseBirthdayValue,
    pickDay,
    pickMonth,
    pickYear
} from "./birthdayHelpers.js";

describe("birthdayHelpers", () => {
    it("should read the parts of a date-only value", () => {
        expect(parseBirthdayValue("1990-02-09")).toEqual({ day: 9, month: 2, year: 1990 });
    });

    it("should read the date part of a value that carries a time", () => {
        expect(parseBirthdayValue("1990-02-09T00:00:00.000Z")).toEqual({
            day: 9,
            month: 2,
            year: 1990
        });
    });

    it("should read no parts from an empty or impossible value", () => {
        expect(parseBirthdayValue(undefined)).toEqual({});
        expect(parseBirthdayValue("")).toEqual({});
        expect(parseBirthdayValue("not a date")).toEqual({});
        expect(parseBirthdayValue("1990-02-30")).toEqual({});
    });

    it("should write a value only once every part is set", () => {
        expect(formatBirthdayValue({ day: 9, month: 2, year: 1990 })).toBe("1990-02-09");
        expect(formatBirthdayValue({ day: 9, month: 2 })).toBeUndefined();
    });

    it("should give February 29 days until a non-leap year is known", () => {
        expect(daysInMonth(2)).toBe(29);
        expect(daysInMonth(2, 2000)).toBe(29);
        expect(daysInMonth(2, 1900)).toBe(28);
        expect(daysInMonth(2, 1990)).toBe(28);
    });

    it("should dim the months that can't hold the 31st", () => {
        const dimmed = Array.from({ length: 12 }, (_, i) => i + 1).filter(month =>
            isMonthDisabled(month, { day: 31 })
        );
        expect(dimmed).toEqual([2, 4, 6, 9, 11]);
    });

    it("should dim no month before a day is picked", () => {
        expect(isMonthDisabled(2, {})).toBe(false);
    });

    it("should clear a month that can't hold the newly picked day and keep the year", () => {
        expect(pickDay({ day: 9, month: 2, year: 1990 }, 31)).toEqual({
            day: 31,
            month: undefined,
            year: 1990
        });
    });

    it("should keep a month that holds the newly picked day", () => {
        expect(pickDay({ day: 9, month: 8, year: 1990 }, 31)).toEqual({
            day: 31,
            month: 8,
            year: 1990
        });
    });

    it("should clear a non-leap year when 29 February is picked", () => {
        expect(pickDay({ day: 9, month: 2, year: 1990 }, 29)).toEqual({
            day: 29,
            month: 2,
            year: undefined
        });
        expect(pickMonth({ day: 29, month: 1, year: 1990 }, 2)).toEqual({
            day: 29,
            month: 2,
            year: undefined
        });
        expect(pickMonth({ day: 29, month: 1, year: 1992 }, 2)).toEqual({
            day: 29,
            month: 2,
            year: 1992
        });
    });

    it("should dim non-leap years for 29 February only", () => {
        expect(isYearDisabled(1990, { day: 29, month: 2 })).toBe(true);
        expect(isYearDisabled(1992, { day: 29, month: 2 })).toBe(false);
        expect(isYearDisabled(1990, { day: 28, month: 2 })).toBe(false);
        expect(isYearDisabled(1990, { day: 29 })).toBe(false);
    });

    it("should set the year", () => {
        expect(pickYear({ day: 31, month: 8 }, 1990)).toEqual({ day: 31, month: 8, year: 1990 });
    });

    it("should list years newest first", () => {
        expect(birthdayYears([1985, 1990])).toEqual([1990, 1989, 1988, 1987, 1986, 1985]);
        expect(birthdayYears([1990, 1985])).toEqual([1990, 1989, 1988, 1987, 1986, 1985]);
    });

    it("should default to this year back 120 years", () => {
        const currentYear = new Date().getFullYear();
        const years = birthdayYears();
        expect(years[0]).toBe(currentYear);
        expect(years[years.length - 1]).toBe(currentYear - 120);
    });

    it("should include a set year that falls outside the range", () => {
        expect(birthdayYears([1985, 1987], 1980)).toEqual([
            1987, 1986, 1985, 1984, 1983, 1982, 1981, 1980
        ]);
    });

    describe("within minDate and maxDate", () => {
        const range = {
            years: birthdayYears([2000, 2026]),
            minDate: new Date(2000, 2, 10),
            maxDate: new Date(2026, 9, 15)
        };

        it("should dim the years outside the limits", () => {
            const wide = { ...range, years: birthdayYears([1995, 2030]) };
            expect(isYearDisabled(1999, {}, wide)).toBe(true);
            expect(isYearDisabled(2000, {}, wide)).toBe(false);
            expect(isYearDisabled(2026, {}, wide)).toBe(false);
            expect(isYearDisabled(2027, {}, wide)).toBe(true);
        });

        it("should dim the last year when the picked day and month fall after maxDate", () => {
            expect(isYearDisabled(2026, { day: 16, month: 10 }, range)).toBe(true);
            expect(isYearDisabled(2026, { day: 15, month: 10 }, range)).toBe(false);
            expect(isYearDisabled(2026, { day: 1, month: 11 }, range)).toBe(true);
            expect(isYearDisabled(2025, { day: 1, month: 11 }, range)).toBe(false);
        });

        it("should dim the first year when the picked day and month fall before minDate", () => {
            expect(isYearDisabled(2000, { day: 9, month: 3 }, range)).toBe(true);
            expect(isYearDisabled(2000, { day: 10, month: 3 }, range)).toBe(false);
        });

        it("should dim the months and days that no date in range has", () => {
            const oneYear = { ...range, years: [2026] };
            expect(isMonthDisabled(10, {}, oneYear)).toBe(false);
            expect(isMonthDisabled(11, {}, oneYear)).toBe(true);
            expect(isMonthDisabled(10, { day: 16 }, oneYear)).toBe(true);

            const oneMonth = {
                years: [2026],
                minDate: new Date(2026, 9, 1),
                maxDate: new Date(2026, 9, 15)
            };
            expect(isDayDisabled(15, oneMonth)).toBe(false);
            expect(isDayDisabled(16, oneMonth)).toBe(true);
            expect(isDayDisabled(16, range)).toBe(false);
        });

        it("should keep 29 February when the range offers a leap year", () => {
            expect(isMonthDisabled(2, { day: 29 }, range)).toBe(false);
            expect(isMonthDisabled(2, { day: 29 }, { ...range, years: [2025] })).toBe(true);
        });

        it("should clear a year the newly picked part puts past a limit", () => {
            expect(pickDay({ day: 1, month: 10, year: 2026 }, 20, range)).toEqual({
                day: 20,
                month: 10,
                year: undefined
            });
            expect(pickMonth({ day: 1, month: 10, year: 2026 }, 12, range)).toEqual({
                day: 1,
                month: 12,
                year: undefined
            });
            expect(pickDay({ day: 1, month: 10, year: 2026 }, 15, range)).toEqual({
                day: 15,
                month: 10,
                year: 2026
            });
        });

        it("should end the default years at maxDate and start them at minDate", () => {
            const years = birthdayYears(undefined, undefined, { maxDate: new Date(2000, 0, 1) });
            expect(years[0]).toBe(2000);
            expect(years[years.length - 1]).toBe(1880);
            expect(
                birthdayYears(undefined, undefined, {
                    minDate: new Date(1990, 0, 1),
                    maxDate: new Date(1995, 0, 1)
                })
            ).toEqual([1995, 1994, 1993, 1992, 1991, 1990]);
        });

        it("should start the default years at a maxDate in the future", () => {
            const currentYear = new Date().getFullYear();
            const years = birthdayYears(undefined, undefined, {
                maxDate: new Date(currentYear + 2, 0, 1)
            });
            expect(years[0]).toBe(currentYear + 2);
            expect(years[years.length - 1]).toBe(currentYear + 2 - 120);
        });

        it("should run the default years from this year down to an old minDate", () => {
            const currentYear = new Date().getFullYear();
            const years = birthdayYears(undefined, undefined, { minDate: new Date(1850, 0, 1) });
            expect(years[0]).toBe(currentYear);
            expect(years[years.length - 1]).toBe(1850);
        });

        it("should start the default years at a minDate in the future", () => {
            const currentYear = new Date().getFullYear();
            const years = birthdayYears(undefined, undefined, {
                minDate: new Date(currentYear + 3, 0, 1)
            });
            expect(years).toEqual([currentYear + 3]);
        });

        it("should ignore an invalid limit", () => {
            expect(isYearDisabled(2026, {}, { years: [2026], maxDate: new Date("nope") })).toBe(
                false
            );
        });
    });

    it("should go to the next missing part after a pick", () => {
        expect(nextBirthdayStep({ day: 9 }, "day", new Set(["day"]))).toBe("month");
        expect(nextBirthdayStep({ month: 2, year: 1990 }, "year", new Set(["year"]))).toBe("day");
    });

    it("should close once a pick out of order completes the date", () => {
        const picked = new Set(["year", "day", "month"] as const);
        expect(nextBirthdayStep({ day: 9, month: 2, year: 1990 }, "month", picked)).toBe(undefined);
    });

    it("should walk on through the later steps when editing a saved date", () => {
        const date = { day: 9, month: 2, year: 1990 };
        expect(nextBirthdayStep(date, "day", new Set(["day"]))).toBe("month");
        expect(nextBirthdayStep(date, "month", new Set(["day", "month"]))).toBe("year");
        expect(nextBirthdayStep(date, "year", new Set(["day", "month", "year"]))).toBe(undefined);
    });
});
