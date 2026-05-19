import type { ComponentProps } from "react";

export type TDate = Date | string | number;

export interface UpdateIntervals {
    readonly underFiveMinutes?: number;
    readonly underFifteenMinutes?: number;
    readonly underOneHour?: number;
}

export interface Opts {
    readonly relativeDate?: TDate;
    readonly minInterval?: number;
    readonly updateIntervals?: UpdateIntervals;
}

export interface TimeAgoProps extends ComponentProps<"time"> {
    readonly datetime: TDate;
    readonly live?: boolean;
    readonly opts?: Opts;
    readonly locale?: string;
}
