const TIME_SEPARATOR = ":";

export const getIsoStringTillMinutes = (datetime: string): string => {
    /**
     * Validate datetime.
     */
    if (isNaN(Date.parse(datetime))) {
        return datetime;
    }
    // input = "2022-03-08T05:41:13.230Z"
    // output = "2022-03-08T05:41"
    return datetime.slice(0, datetime.lastIndexOf(TIME_SEPARATOR));
};

export const dateTimeToCronExpression = (datetime: string): string => {
    if (!datetime) {
        return "* * * * ? 2000";
    }
    const date = new Date(datetime);
    const min = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    /**
     * Cron expressions expect month in range of 1-12
     */
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const dayOfWeek = "?";

    return `${min} ${hour} ${dayOfMonth} ${month} ${dayOfWeek} ${year}`;
};

export const getFutureDate = (datetime: string): string => {
    const date = new Date(datetime);
    const year = date.getUTCFullYear();
    const next = year + 100;

    date.setUTCFullYear(next);
    return date.toISOString();
};

export const updateYear = (datetime: string, setValue: (current: number) => number): string => {
    const date = new Date(datetime);
    const year = date.getUTCFullYear();
    const next = setValue(year);

    date.setUTCFullYear(next);
    return date.toISOString();
};
