export const calculateExpiresOn = (savedOn: string | undefined, timeout: number): Date => {
    if (!savedOn) {
        throw new Error("Missing savedOn property.");
    }
    const savedOnDate = new Date(savedOn);

    return new Date(savedOnDate.getTime() + timeout);
};
