import { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types";

export type ArticleCmsEntry = Omit<CmsEntry<ArticleCmsEntryValues>, "location">;

export interface ArticleCmsEntryValues extends CmsEntryValues {
    textField: string;
    longTextField: string;
    richTextField: Record<string, any>;
    numberField: number;
    dateTimeField: string;
    timeField: string;
    objectField: {
        textField: string;
        longTextField: string;
        richTextField: Record<string, any>;
        numberField: number;
        dateTimeField: string;
        timeField: string;
    };
}

export type DynamoDbRecord<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
    _et: string;
    _md: string;
    _ct: string;
};
