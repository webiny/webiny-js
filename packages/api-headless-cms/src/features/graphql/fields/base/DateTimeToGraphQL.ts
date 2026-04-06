import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelField, CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";

const fieldGraphQLTypes = {
    time: "Time",
    dateTimeWithoutTimezone: "DateTime",
    dateTimeWithTimezone: "DateTimeZ",
    date: "Date"
};

type FieldGraphQLKeys = keyof typeof fieldGraphQLTypes;

const getFieldGraphQLType = (field: CmsModelField): string => {
    const type = field.settings?.type as FieldGraphQLKeys | undefined;
    if (!type || !fieldGraphQLTypes[type]) {
        return fieldGraphQLTypes.dateTimeWithoutTimezone;
    }
    return fieldGraphQLTypes[type];
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        const gqlType = getFieldGraphQLType(field);
        if (field.list) {
            return `${field.fieldId}: [${gqlType}]`;
        }
        return `${field.fieldId}: ${gqlType}`;
    }

    public createGetFilters({ field }: CmsModelFieldToGraphQL.GetFiltersParams): string {
        return `${field.fieldId}: ${getFieldGraphQLType(field)}`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        const gqlType = getFieldGraphQLType(field);
        return `
            ${field.fieldId}: ${gqlType}
            ${field.fieldId}_not: ${gqlType}
            ${field.fieldId}_in: [${gqlType}]
            ${field.fieldId}_not_in: [${gqlType}]
            ${field.fieldId}_lt: ${gqlType}
            ${field.fieldId}_lte: ${gqlType}
            ${field.fieldId}_gt: ${gqlType}
            ${field.fieldId}_gte: ${gqlType}
        `;
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        const gqlType = getFieldGraphQLType(field);
        if (field.list) {
            return `${field.fieldId}: [${gqlType}]`;
        }
        return `${field.fieldId}: ${gqlType}`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        const gqlType = getFieldGraphQLType(field);
        return `
            ${field.fieldId}: ${gqlType}
            ${field.fieldId}_not: ${gqlType}
            ${field.fieldId}_in: [${gqlType}]
            ${field.fieldId}_not_in: [${gqlType}]
            ${field.fieldId}_lt: ${gqlType}
            ${field.fieldId}_lte: ${gqlType}
            ${field.fieldId}_gt: ${gqlType}
            ${field.fieldId}_gte: ${gqlType}
        `;
    }

    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, getFieldGraphQLType(field));
    }
}

class DateTimeToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "datetime";
    public readonly isSearchable: boolean = true;
    public readonly isSortable: boolean = true;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const DateTimeFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: DateTimeToGraphQL,
    dependencies: []
});
