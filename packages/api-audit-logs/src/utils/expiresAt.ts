export const convertExpiresAtDaysToDate = (days: number | undefined | null): Date | undefined => {
    if (!days) {
        return undefined;
    }
    const date = new Date();
    date.setTime(days * 24 * 60 * 60 * 1000 + date.getTime());
    return date;
};

export const convertExpiresAtToUnixTimestamp = (
    expiresAt: Date | string | null | undefined
): number | undefined => {
    if (!expiresAt) {
        return undefined;
    } else if (typeof expiresAt === "string") {
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
