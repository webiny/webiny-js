import React, { useMemo } from "react";

export interface DateComponentProps {
    date: string;
    options?: Intl.DateTimeFormatOptions;
    locale?: string;
}

export const DateComponent = ({
    date,
    options = {
        day: "numeric",
        month: "long",
        year: "numeric"
    },
    locale
}: DateComponentProps) => {
    const formatDate = useMemo(() => {
        // Convert the input string to a Date object
        const dateObject = new Date(date);

        // Check if the input date is valid
        if (isNaN(dateObject.getDate())) {
            console.log("Invalid date");
            return "";
        }

        /**
         *  Determine the final locale:
         *  - use the prop `locale` if provided.
         *  - try to guess the navigator language, use it only if it's a subset of `en`locale, since the admin is not localized.
         *  - use `en-US`as default.
         */
        const localeCode =
            locale ||
            (navigator.language && navigator.language.startsWith("en")
                ? navigator.language
                : "en-US");

        return new Intl.DateTimeFormat(localeCode, options).format(dateObject);
    }, [date, locale, options]);

    return <>{formatDate}</>;
};
