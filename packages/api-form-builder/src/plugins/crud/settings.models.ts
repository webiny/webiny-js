import { validation } from "@webiny/validation";
import { withFields, string, boolean, fields } from "@commodo/fields";

export const CreateDataModel = withFields({
    installed: boolean({ value: false }),
    domain: string(),
    reCaptcha: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            siteKey: string({ validation: validation.create("maxLength:100") }),
            secretKey: string({ validation: validation.create("maxLength:100") })
        })()
    })
})();

export const UpdateDataModel = withFields({
    domain: string(),
    reCaptcha: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            siteKey: string({ validation: validation.create("maxLength:100") }),
            secretKey: string({ validation: validation.create("maxLength:100") })
        })()
    })
})();
