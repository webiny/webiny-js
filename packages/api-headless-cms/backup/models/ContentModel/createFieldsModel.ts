import { validation } from "@webiny/validation";
import { withFields, string, object, setOnce, onSet, boolean, fields, pipe } from "@webiny/commodo";
import { i18nField } from "@webiny/api-headless-cms/content/plugins/modelFields/i18nFields";
import { any } from "@webiny/api-headless-cms/content/plugins/models/anyField";
import idValidation from "./idValidation";

const requiredShortString = validation.create("required,maxLength:256");
const shortString = validation.create("maxLength:265");

export default context => {
    const RendererModel = withFields({
        name: string({ validation: requiredShortString })
    })();

    return withFields({
        _id: setOnce()(string({ validation: requiredShortString })),
        fieldId: pipe(
            onSet(value => value && value.trim()),
            setOnce()
        )(string({ validation: idValidation })),
        label: i18nField({
            field: string({ validation: requiredShortString }),
            context
        }),
        helpText: i18nField({
            field: string({ validation: shortString }),
            context
        }),
        placeholderText: i18nField({
            field: string({ validation: shortString }),
            context
        }),
        type: setOnce()(string({ validation: requiredShortString })),
        multipleValues: boolean({ value: false }),
        predefinedValues: fields({
            value: {},
            instanceOf: withFields({
                enabled: boolean(),
                values: i18nField({ field: any({ list: true }), context })
            })()
        }),
        renderer: fields({ instanceOf: RendererModel, validation: shortString }),
        validation: fields({
            list: true,
            value: [],
            instanceOf: withFields({
                name: string({ validation: requiredShortString }),
                message: i18nField({ field: string({ validation: shortString }), context }),
                settings: object({ value: {} })
            })()
        }),
        settings: object({ value: {} })
    })();
};
