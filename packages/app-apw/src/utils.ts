import { customAlphabet } from "nanoid";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
// Extend dayjs format.
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const getNanoid = customAlphabet(ALPHANUMERIC, 10);

export const formatDate = (date: string): string => {
    return dayjs(date).format("MMM Do, YYYY");
};
/**
 *
 * Format datetime in a particular format for change content status UI.
 * For example, "15th Dec, 2021 at 15:34 pm UTC"
 */
export const formatDatetime = (date: string): string => {
    return dayjs.utc(date).format("DD[th] MMM, YYYY [at] hh:mm a");
};

export const fromNow = (date: string): string => {
    return dayjs(date).fromNow();
};

export const routePaths = {
    CONTENT_REVIEWS: `/apw/content-reviews`
};
