interface ITimer {
    /* Return value must be in milliseconds. */
    getRemainingMilliseconds(): number;
    /* Return value must be in seconds. */
    getRemainingSeconds(): number;
}

export namespace Timer {
    export type Interface = ITimer;
}
