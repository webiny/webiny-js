const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

// A 24-hour "HH:MM" in the viewer's timezone.
export const formatTimeOfDay = (date: Date): string => {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${hours}:${minutes}`;
};
