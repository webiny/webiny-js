import sortBy from "lodash/sortBy";
import { CmsModel } from "@webiny/app-headless-cms-common/types";
import { FieldRaw } from "@webiny/app-aco/components/AdvancedSearch/domain";

export class FieldsMapper {
    private static excluded: FieldRaw["type"][] = ["rich-text", "file", "object", "dynamicZone"];
    private static defaultFields: FieldRaw[] = [
        {
            id: "status",
            type: "text",
            label: "Status",
            multipleValues: false,
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

    static toRaw(model: CmsModel): FieldRaw[] {
        const modelFields = model.fields
            .filter(modelField => !this.excluded.includes(modelField.type))
            .map(modelField => {
                return {
                    id: modelField.fieldId,
                    type: modelField.type,
                    label: modelField.label,
                    multipleValues: modelField.multipleValues || false,
                    predefinedValues: modelField?.predefinedValues || undefined,
                    settings: modelField.settings
                };
            });

        return sortBy([...this.defaultFields, ...modelFields], ["label"]);
    }
}
