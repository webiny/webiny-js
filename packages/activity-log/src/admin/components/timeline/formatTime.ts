export const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

export const isValidTimestamp = (iso: string): boolean => !Number.isNaN(new Date(iso).getTime());

/** Clock time alone, for a ledger column where the date is already established by the row. */
export const formatClock = (iso: string, withSeconds = false): string => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return iso;
    }

    return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        ...(withSeconds ? { second: "2-digit" } : {})
    });
};
