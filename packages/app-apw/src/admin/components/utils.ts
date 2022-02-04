import { customAlphabet } from "nanoid";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
// Extend dayjs format.
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const getNanoid = customAlphabet(ALPHANUMERIC, 10);

export const formatDate = (date: string): string => {
    return dayjs(date).format("MMM Do, YYYY");
};

export const fromNow = (date: string): string => {
    return dayjs(date).fromNow();
};
