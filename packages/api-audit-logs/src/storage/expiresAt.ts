export const createExpiresAt = (expiresAt: Date | null | undefined): number | undefined => {
    if (!expiresAt) {
        return undefined;
    }
    return Math.floor(expiresAt.getTime() / 1000);
};
