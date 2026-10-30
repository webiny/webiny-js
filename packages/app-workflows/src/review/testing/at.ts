// 16 Oct 2026 at the given local time, as an ISO string.
export const at = (hour: number, minute: number): string => {
    return new Date(2026, 9, 16, hour, minute).toISOString();
};
