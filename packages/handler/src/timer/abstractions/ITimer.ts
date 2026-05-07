export interface ITimer {
    /**
     * Return value must be in milliseconds.
     */
    getRemainingMilliseconds(): number;
    /**
     * Return value must be in seconds.
     */
    getRemainingSeconds(): number;
}
