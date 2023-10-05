import {
    createBooleanField,
    createDateField,
    createDateTimeField,
    createField,
    CreateFieldInput,
    createFileField,
    createLayout,
    createLongTextField,
    createNumberField,
    createObjectField,
    createReferenceField,
    createRichTextField,
    createTextField,
    createTimeField
} from "./fields";
import { CmsModelField } from "~/types";

export const createDynamicZoneField = (params: Partial<CreateFieldInput> = {}) => {
    const parentParams = {
        parentId: "dz"
    };
    const fields: CmsModelField[] = [
        createTextField(parentParams),
        createLongTextField(parentParams),
        createRichTextField(parentParams),
        createNumberField(parentParams),
        createBooleanField(parentParams),
        createDateField(parentParams),
        createTimeField(parentParams),
        createDateTimeField(parentParams),
        createFileField(parentParams),
        createReferenceField(parentParams),
        createObjectField(parentParams)
    ];
    return createField({
        id: "dz",
        fieldId: "dz",
        type: "dynamicZone",
        label: "Dynamic Zone",
        renderer: {
            name: "dynamicZone"
        },
        validation: [
            {
                name: "required",
                message: "You need to add at least 1 template data."
            }
        ],
        settings: {
            templates: [
                {
                    layout: createLayout(fields),
                    name: "Hero #1",
                    gqlTypeName: "Hero",
                    icon: "fas/flag",
                    description: "",
                    id: "abcdefgh",
                    fields,
                    validation: [
                        {
                            name: "minLength",
                            message: "You need to add at least 1 Hero template.",
                            settings: {
                                value: "1"
                            }
                        },
                        {
                            name: "maxLength",
                            message: "You are allowed to add no more than 2 Hero templates.",
                            settings: {
                                value: "2"
                            }
                        }
                    ]
                }
            ]
        },
        ...params
    });
};
