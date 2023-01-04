import { validation } from "@webiny/validation";
/**
 * Package commodo-fields-object does not have types
 */
// @ts-ignore
import { object } from "commodo-fields-object";
/**
 * Package commodo-fields does not have object.
 */
// @ts-ignore
import { withFields, string, setOnce, boolean, fields } from "@commodo/fields";
import { validateFieldId } from "./fieldIdValidation";

const requiredShortString = validation.create("required,maxLength:255");
const shortString = validation.create("maxLength:255");

const RendererModel = withFields({
    name: string({ validation: requiredShortString })
})();

export const ContentModelFieldModel = withFields({
    id: string({ validation: requiredShortString }),
    fieldId: string({
        validation: validateFieldId
    }),
    label: string({ validation: requiredShortString }),
    helpText: string({ validation: shortString }),
    placeholderText: string({ validation: shortString }),
    type: setOnce()(string({ validation: requiredShortString })),
    tags: object({ value: [], required: false }),
    multipleValues: boolean({ value: false }),
    predefinedValues: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            values: fields({
                value: [],
                list: true,
                instanceOf: withFields({
                    label: string(),
                    value: string(),
                    selected: boolean()
                })()
            })
        })()
    }),
    renderer: fields({ instanceOf: RendererModel, validation: shortString }),
    validation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: requiredShortString }),
            message: string({ validation: shortString }),
            settings: object({ value: {} })
        })()
    }),
    listValidation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: requiredShortString }),
            message: string({ validation: shortString }),
            settings: object({ value: {} })
        })()
    }),
    settings: object({ value: {} })
    /**
     * By the default, field is not deleted.
     */
    // isDeleted: boolean({ value: false })
})();

export const CreateContentModelModel = withFields({
    name: string({ validation: requiredShortString }),
    modelId: string({ validation: shortString }),
    description: string({ validation: shortString }),
    group: string({ validation: requiredShortString }),
    fields: fields({ instanceOf: ContentModelFieldModel, value: [], list: true, required: true }),
    layout: object({ value: [], required: true }),
    tags: object({ value: [], required: false })
})();

export const CreateContentModelModelFrom = withFields({
    name: string({ validation: requiredShortString }),
    modelId: string({ validation: shortString }),
    description: string({ validation: shortString }),
    group: string({ validation: requiredShortString }),
    locale: string({ validation: shortString })
})();

export const UpdateContentModelModel = withFields({
    name: string({ validation: shortString }),
    description: string({ validation: shortString }),
    group: string({ validation: shortString }),
    titleFieldId: string(),
    fields: fields({ instanceOf: ContentModelFieldModel, value: [], list: true, required: true }),
    layout: object({ value: [], required: true }),
    tags: object({ value: [], required: false })
})();
