import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants";

export const renderListFilterMetaFields = (): string => {
    return [
        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */
        ...ENTRY_META_FIELDS.map(field => {
            if (isDateTimeEntryMetaField(field)) {
                return [
                    `${field}: DateTime`,
                    `${field}_gt: DateTime`,
                    `${field}_gte: DateTime`,
                    `${field}_lt: DateTime`,
                    `${field}_lte: DateTime`,
                    `${field}_between: [DateTime!]`,
                    `${field}_not_between: [DateTime!]`
                ];
            }

            return [
                `${field}: ID`,
                `${field}_not: ID`,
                `${field}_in: [ID!]`,
                `${field}_not_in: [ID!]`
            ];
        }).flat()
    ].join("\n");
};
