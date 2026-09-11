import { describeActor } from "./describeActor.js";
import type { TimelineGroup } from "./groupByRevision.js";

export interface DescribedGroup {
    /** "Revision 4", or the raw revision id when it carries no version suffix. */
    label: string;
    /** "9 saves · 1–2 Sep" — how much happened, and when. */
    meta: string;
    /**
     * Who was involved, as a sentence: "Nina Kovač, Marko Ilić and Content assistant".
     *
     * Lets a reader see the cast of a revision without expanding anything, which is most of the
     * point of grouping by revision at all.
     */
    who: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "1–2 Sep", "28 Aug", "28 Aug – 2 Sep", or "" for an unparseable timestamp.
 *
 * Deliberately drops the year. A timeline is read newest-first and the year is almost always
 * this one; where it matters, each row carries a full timestamp of its own.
 */
export const formatDateRange = (earliest: string, latest: string): string => {
    const from = new Date(earliest);
    const to = new Date(latest);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return "";
    }

    const fromDay = from.getDate();
    const toDay = to.getDate();
    const fromMonth = MONTHS[from.getMonth()]!;
    const toMonth = MONTHS[to.getMonth()]!;

    if (fromDay === toDay && fromMonth === toMonth) {
        return `${toDay} ${toMonth}`;
    }

    if (fromMonth === toMonth) {
        return `${fromDay}–${toDay} ${toMonth}`;
    }

    return `${fromDay} ${fromMonth} – ${toDay} ${toMonth}`;
};

/**
 * Joins names the way a person would: "A", "A and B", "A, B and C".
 *
 * Caps at three and counts the rest, because a revision worked on by nine people would otherwise
 * push everything else out of the header.
 */
export const formatNameList = (names: string[]): string => {
    if (names.length === 0) {
        return "";
    }
    if (names.length === 1) {
        return names[0]!;
    }
    if (names.length === 2) {
        return `${names[0]} and ${names[1]}`;
    }
    if (names.length === 3) {
        return `${names[0]}, ${names[1]} and ${names[2]}`;
    }

    return `${names[0]}, ${names[1]} and ${names.length - 2} others`;
};

/** The revision header, as one sentence's worth of orientation. */
export const describeGroup = (group: TimelineGroup): DescribedGroup => {
    const saveCount = group.items.reduce((total, item) => total + item.records.length, 0);
    const range = formatDateRange(group.earliestTimestamp, group.latestTimestamp);

    const names: string[] = [];

    for (const item of group.items) {
        for (const record of item.records) {
            const { name } = describeActor({ actor: record.actor, source: record.source });

            if (!names.includes(name)) {
                names.push(name);
            }
        }
    }

    const counted = `${saveCount} ${saveCount === 1 ? "save" : "saves"}`;

    return {
        label: group.version === null ? group.revision : `Revision ${group.version}`,
        meta: range === "" ? counted : `${counted} · ${range}`,
        who: formatNameList(names)
    };
};
