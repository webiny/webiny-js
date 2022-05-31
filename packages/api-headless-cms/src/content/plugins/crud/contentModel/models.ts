import { validation } from "@webiny/validation";
import flow from "lodash/flow";
/**
 * Package commodo-fields-object does not have types
 */
// @ts-ignore
import { object } from "commodo-fields-object";
/**
 * Package commodo-fields does not have object.
 */
// @ts-ignore
import { withFields, string, setOnce, onSet, boolean, fields } from "@commodo/fields";
import idValidation from "./idValidation";

const requiredShortString = validation.create("required,maxLength:255");
const shortString = validation.create("maxLength:255");

const RendererModel = withFields({
    name: string({ validation: requiredShortString })
})();

export const ContentModelFieldModel = withFields({
    id: string({ validation: requiredShortString }),
    fieldId: flow(
        onSet((value?: string) => value && value.trim()),
        setOnce()
    )(string({ validation: idValidation })),
    label: string({ validation: requiredShortString }),
    helpText: string({ validation: shortString }),
    placeholderText: string({ validation: shortString }),
    type: setOnce()(string({ validation: requiredShortString })),
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
})();

export const CreateContentModelModel = withFields({
    name: string({ validation: requiredShortString }),
    modelId: string({ validation: shortString }),
    description: string({ validation: shortString }),
    group: string({ validation: requiredShortString }),
    fields: fields({ instanceOf: ContentModelFieldModel, value: [], list: true, required: true }),
    layout: object({ value: [], required: true })
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
    layout: object({ value: [], required: true })
})();
