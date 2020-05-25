import { validation } from "@webiny/validation";
import { withFields, string, object, setOnce, boolean, fields } from "@webiny/commodo";
import { i18nField } from "@webiny/api-headless-cms/content/plugins/modelFields/i18nFields";
import { any } from "@webiny/api-headless-cms/content/plugins/models/anyField";

const requiredShortString = validation.create("required,maxLength:256");
const shortString = validation.create("maxLength:265");

export default context => {
    const PredefinedValueModel = withFields({
        value: i18nField({ field: any(), context }),
        label: i18nField({ field: any(), context })
    });

    const RendererModel = withFields({
        name: string({ validation: requiredShortString })
    })();

    return withFields({
        _id: setOnce()(string({ validation: requiredShortString })),
        fieldId: setOnce()(string({ validation: requiredShortString })),
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
        predefinedValues: fields({ instanceOf: PredefinedValueModel, list: true }),
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
