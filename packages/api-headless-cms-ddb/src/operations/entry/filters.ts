import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

const defaultSystemFields = ["id", "createdOn", "savedOn", "createdBy", "ownedBy"];

const createOperation = (raw: string, value: any): Record<string, any> => {
    switch (raw) {
        case "eq":
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "in":
        case "between":
            return {
                [raw]: value
            };
        case "not_eq":
        case "not_in":
        case "not_between":
            const op = raw.replace("not_", "");
            return {
                [op]: value,
                negate: true
            };
    }
    throw new WebinyError("Operation not supported.", "OP_NOT_SUPPORTED", {
        operation: raw
    });
};

interface ExtractArgs {
    key: string;
    fields: string[];
    systemFields: string[];
    parent: string;
    value: any;
}
const extract = (args: ExtractArgs): Record<string, any> => {
    const { key, fields, systemFields, parent, value } = args;
    const [attr, rawOp] = key.split("_", 1);
    const isSystemField = systemFields.includes(attr);
    if (fields.includes(attr) === false && !isSystemField) {
        throw new WebinyError(
            "Filtering field does not exist in the content model.",
            "FILTERING_FIELD_ERROR",
            {
                attr,
                fields
            }
        );
    }
    const operation = createOperation(rawOp, value);
    return {
        attr: isSystemField ? attr : `${parent}.${attr}`,
        ...operation
    };
};

interface CreateFiltersArgs {
    context: CmsContext;
    model: CmsContentModel;
    where?: Record<string, any>;
}
export const createFilters = (args: CreateFiltersArgs): any[] | undefined => {
    const { model, where } = args;
    const keys = Object.keys(where);
    if (!where || keys.length === 0) {
        return undefined;
    }

    const fields = defaultSystemFields.concat(model.fields.map(field => field.fieldId));

    return keys.reduce((filters, key) => {
        const value = where[key];

        const filter = extract({
            key,
            systemFields: defaultSystemFields,
            fields,
            parent: "values",
            value
        });

        filters.push(filter);
        return filters;
    }, []);
};
