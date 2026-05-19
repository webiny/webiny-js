import React from "react";
import { useState, useEffect, type ComponentProps } from "react";

export type TDate = Date | string | number;

export interface Opts {
    readonly relativeDate?: TDate;
    readonly minInterval?: number;
}

export interface TimeAgoProps extends ComponentProps<"time"> {
    readonly datetime: TDate;
    readonly live?: boolean;
    readonly opts?: Opts;
    readonly locale?: string;
}

function toEpochMs(date: TDate): number {
    if (date instanceof Date) {
        return date.getTime();
    }
    if (typeof date === "number") {
        return date;
    }
    return new Date(date).getTime();
}

function getElapsedSeconds(datetime: TDate, relativeDate?: TDate): number {
    const now = relativeDate
        ? Temporal.Instant.fromEpochMilliseconds(toEpochMs(relativeDate))
        : Temporal.Now.instant();
    const past = Temporal.Instant.fromEpochMilliseconds(toEpochMs(datetime));
    return Math.round(now.since(past).total("second"));
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2_592_000;
const YEAR = 31_536_000;

function formatElapsed(seconds: number): string {
    const abs = Math.abs(seconds);
    const suffix = seconds < 0 ? "from now" : "ago";

    if (abs < 30) {
        return "just now";
    }
    if (abs < MINUTE) {
        return `${abs} seconds ${suffix}`;
    }
    if (abs < 2 * MINUTE) {
        return `1 minute ${suffix}`;
    }
    if (abs < HOUR) {
        return `${Math.floor(abs / MINUTE)} minutes ${suffix}`;
    }
    if (abs < 2 * HOUR) {
        return `1 hour ${suffix}`;
    }
    if (abs < DAY) {
        return `${Math.floor(abs / HOUR)} hours ${suffix}`;
    }
    if (abs < 2 * DAY) {
        return `1 day ${suffix}`;
    }
    if (abs < WEEK) {
        return `${Math.floor(abs / DAY)} days ${suffix}`;
    }
    if (abs < 2 * WEEK) {
        return `1 week ${suffix}`;
    }
    if (abs < MONTH) {
        return `${Math.floor(abs / WEEK)} weeks ${suffix}`;
    }
    if (abs < 2 * MONTH) {
        return `1 month ${suffix}`;
    }
    if (abs < YEAR) {
        return `${Math.floor(abs / MONTH)} months ${suffix}`;
    }
    if (abs < 2 * YEAR) {
        return `1 year ${suffix}`;
    }
    return `${Math.floor(abs / YEAR)} years ${suffix}`;
}

function getUpdateDelay(seconds: number, minInterval?: number): number {
    const abs = Math.abs(seconds);
    let delay: number;

    if (abs < MINUTE) {
        delay = 10_000;
    } else if (abs < HOUR) {
        delay = 30_000;
    } else if (abs < DAY) {
        delay = 300_000;
    } else {
        delay = 3_600_000;
    }

    if (minInterval) {
        delay = Math.max(delay, minInterval * 1000);
    }

    return delay;
}

function toISOString(date: TDate): string {
    if (date instanceof Date) {
        return date.toISOString();
    }
    if (typeof date === "number") {
        return new Date(date).toISOString();
    }
    return date;
}

export function TimeAgo({ datetime, live = true, opts, locale: _locale, ...rest }: TimeAgoProps) {
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!live) {
            return;
        }

        let timer: ReturnType<typeof setTimeout>;

        function schedule() {
            const elapsed = getElapsedSeconds(datetime, opts?.relativeDate);
            const delay = getUpdateDelay(elapsed, opts?.minInterval);
            timer = setTimeout(() => {
                setTick(t => t + 1);
                schedule();
            }, delay);
        }

        schedule();

        return () => clearTimeout(timer);
    }, [datetime, live, opts?.relativeDate, opts?.minInterval]);

    const seconds = getElapsedSeconds(datetime, opts?.relativeDate);

    return (
        <time dateTime={toISOString(datetime)} {...rest}>
            {formatElapsed(seconds)}
        </time>
    );
}
