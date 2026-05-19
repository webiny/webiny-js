import React from "react";
import { useState, useEffect, useMemo } from "react";
import type { TimeAgoProps } from "./types.js";
import { formatElapsed } from "./formatElapsed.js";
import { DEFAULT_INTERVALS, getUpdateDelay } from "./getUpdateDelay.js";
import { getElapsedSeconds } from "./getElapsedSeconds.js";
import { toISOString } from "./toISOString.js";

export function TimeAgo({ datetime, live = true, opts, locale: _locale, ...rest }: TimeAgoProps) {
    const [, setTick] = useState(0);

    const intervals = useMemo(
        () => ({ ...DEFAULT_INTERVALS, ...opts?.updateIntervals }),
        [
            opts?.updateIntervals?.underFiveMinutes,
            opts?.updateIntervals?.underFifteenMinutes,
            opts?.updateIntervals?.underOneHour
        ]
    );

    useEffect(() => {
        if (!live) {
            return;
        }

        let timer: ReturnType<typeof setTimeout>;

        function schedule() {
            const elapsed = getElapsedSeconds(datetime, opts?.relativeDate);
            const delay = getUpdateDelay(elapsed, opts?.minInterval, intervals);
            if (delay === null) {
                return;
            }
            timer = setTimeout(() => {
                setTick(t => t + 1);
                schedule();
            }, delay);
        }

        schedule();

        return () => clearTimeout(timer);
    }, [datetime, live, opts?.relativeDate, opts?.minInterval, intervals]);

    const seconds = getElapsedSeconds(datetime, opts?.relativeDate);

    return (
        <time dateTime={toISOString(datetime)} {...rest}>
            {formatElapsed(seconds)}
        </time>
    );
}
