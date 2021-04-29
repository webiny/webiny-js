import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

const defaultSystemFields = ["id", "createdOn", "savedOn", "createdBy", "ownedBy"];

const createOperation = (operation: string | null | undefined, value: any): Record<string, any> => {
    if (!operation) {
        throw new WebinyError(`Missing operation for value "${value}".`, "OP_MISSING", {
            operation,
            value
        });
    }
    switch (operation) {
        case "eq":
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "in":
        case "between":
            return {
                [operation]: value
            };
        case "not_eq":
        case "not_in":
        case "not_between":
            const op = operation.replace("not_", "");
            return {
                [op]: value,
                negate: true
            };
    }
    throw new WebinyError("Operation not supported.", "OP_NOT_SUPPORTED", {
        operation
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
    const [attr, rawOp = "eq"] = key.split("_", 1);
    const isSystemField = systemFields.includes(attr);
    if (fields.includes(attr) === false && !isSystemField) {
        throw new WebinyError(
            "Filtering field does not exist in the content model.",
            "FILTERING_FIELD_ERROR",
            {
                key,
                value,
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
        return [];
    }

    const fields = defaultSystemFields.concat(model.fields.map(field => field.fieldId));

    return keys.reduce((filters, key) => {
        const value = where[key];
        if (value === undefined) {
            return filters;
        }

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
