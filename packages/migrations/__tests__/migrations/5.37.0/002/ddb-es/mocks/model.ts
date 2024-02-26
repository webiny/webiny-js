import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

const createTextField = (id?: string): CmsModelField => {
    id = id || "textfieldabcdefg";
    return {
        id,
        fieldId: "textField",
        label: "Title",
        type: "text",
        storageId: `text@${id}`
    };
};
const createLongTextField = (id?: string): CmsModelField => {
    id = id || "longtextfieldabcdefg";
    return {
        id,
        fieldId: "longTextField",
        label: "Description",
        type: "long-text",
        storageId: `long-text@${id}`
    };
};
const createRichTextField = (id?: string): CmsModelField => {
    id = id || "richtextfieldabcdefg";
    return {
        id,
        fieldId: "richTextField",
        label: "Body",
        type: "rich-text",
        storageId: `rich-text@${id}`
    };
};
const createNumberField = (id?: string): CmsModelField => {
    id = id || "numberfieldabcdefg";
    return {
        id,
        fieldId: "numberField",
        label: "Number",
        type: "number",
        storageId: `number@${id}`
    };
};
const createDateField = (id?: string): CmsModelField => {
    id = id || "datetimefieldabcdefg";
    return {
        id,
        fieldId: "dateTimeField",
        label: "DateTime",
        type: "datetime",
        storageId: `datetime@${id}`,
        settings: {
            type: "dateTimeWithTimezone"
        }
    };
};
const createTimeField = (id?: string): CmsModelField => {
    id = id || "timefieldabcdefg";
    return {
        id,
        fieldId: "timeField",
        label: "Time",
        type: "datetime",
        storageId: `datetime@${id}`,
        settings: {
            type: "time"
        }
    };
};
const createObjectField = (id?: string): CmsModelField => {
    id = id || "objectfieldabcdefg";
    return {
        id,
        fieldId: "objectField",
        label: "Object",
        type: "object",
        storageId: `object@${id}`,
        settings: {
            fields: [
                createTextField("objecttextfield"),
                createLongTextField("objectlongtextfield"),
                createRichTextField("objectrichtextfield"),
                createNumberField("objectnumberfield"),
                createDateField("objectdatetimefield"),
                createTimeField("objecttimefield")
            ]
        },
        multipleValues: false
    };
};
export const ARTICLE_MODEL_ID = "article";

interface Params {
    tenant: string;
    locale: string;
    webinyVersion: `${number}.${number}.${number}`;
}

export const createArticleModel = (params: Params): CmsModel => {
    return {
        ...params,
        modelId: ARTICLE_MODEL_ID,
        singularApiName: "Article",
        pluralApiName: "Articles",
        name: "Article",
        group: {
            id: "abcdefg",
            name: "Test Group"
        },
        fields: [
            createTextField(),
            createLongTextField(),
            createRichTextField(),
            createNumberField(),
            createDateField(),
            createTimeField(),
            createObjectField()
        ],
        layout: [],
        description: "Article description",
        titleFieldId: "textfield"
    };
};
