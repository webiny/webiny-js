export const convertExpiresAtDaysToDate = (days: number): Date => {
    const date = new Date();
    date.setTime(days * 24 * 60 * 60 * 1000 + date.getTime());
    return date;
};

export const convertExpiresAtToUnixTimestamp = (expiresAt: Date | string): number => {
    if (typeof expiresAt === "string") {
        expiresAt = new Date(expiresAt);
    }
    return Math.floor(expiresAt.getTime() / 1000);
};

export const convertUnixTimestampToDate = (
    expiresAt: number | undefined | null
): Date | undefined => {
    if (!expiresAt) {
        return undefined;
    }
    return new Date(expiresAt * 1000);
};

export const convertUnixTimestampToISODateString = (
    expiresAt: number | undefined | null
): string | undefined => {
    if (!expiresAt) {
        return undefined;
    }
    return convertUnixTimestampToDate(expiresAt)?.toISOString();
};
