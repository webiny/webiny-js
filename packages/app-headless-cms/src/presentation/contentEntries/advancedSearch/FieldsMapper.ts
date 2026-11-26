import sortBy from "lodash/sortBy.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { FieldRaw } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import type { EntryAuthor } from "./abstractions.js";

const AUTHOR_FIELD_ID = "createdBy";

const createAuthorField = (authors: EntryAuthor[]): FieldRaw => {
    return {
        id: AUTHOR_FIELD_ID,
        type: "text",
        label: "Author",
        list: false,
        predefinedValues: {
            enabled: true,
            values: sortBy(authors, ["displayName"]).map(author => ({
                label: author.displayName,
                value: author.id
            }))
        }
    };
};

export class FieldsMapper {
    private static excluded: FieldRaw["type"][] = ["rich-text", "file", "object", "dynamicZone"];
    private static defaultFields: FieldRaw[] = [
        {
            id: "status",
            type: "text",
            label: "Status",
            list: false,
            predefinedValues: {
                enabled: true,
                values: [
                    {
                        label: "Draft",
                        value: "draft"
                    },
                    {
                        label: "Published",
                        value: "published"
                    },
                    {
                        label: "Unpublished",
                        value: "unpublished"
                    }
                ]
            }
        },
        {
            id: "createdOn",
            type: "datetime",
            label: "Created on",
            settings: { type: "dateTimeWithoutTimezone" }
        },
        {
            id: "savedOn",
            type: "datetime",
            label: "Modified on",
            settings: { type: "dateTimeWithoutTimezone" }
        }
    ];

    /*
     * The entry's own fields, as opposed to the model's. Their conditions stay at the top level of
     * the list's where input instead of going under `values`.
     */
    static get systemFieldIds(): string[] {
        return [...this.defaultFields.map(field => field.id), AUTHOR_FIELD_ID];
    }

    static toRaw(model: CmsModel, authors: EntryAuthor[] = []): FieldRaw[] {
        const modelFields = model.fields
            .filter(modelField => !this.excluded.includes(modelField.type))
            .map(modelField => {
                return {
                    id: modelField.fieldId,
                    type: modelField.type,
                    label: modelField.label,
                    list: modelField.list || false,
                    predefinedValues: modelField?.predefinedValues || undefined,
                    settings: modelField.settings
                };
            });

        /*
         * The Author field is offered even before its authors load, or when loading them fails, so
         * a saved filter on Author still opens with its condition and value in place.
         */
        const authorField = createAuthorField(authors);

        return sortBy([...this.defaultFields, authorField, ...modelFields], ["label"]);
    }
}
