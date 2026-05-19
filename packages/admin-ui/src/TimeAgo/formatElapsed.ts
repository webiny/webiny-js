const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2_592_000;
const YEAR = 31_536_000;

export function formatElapsed(seconds: number): string {
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
