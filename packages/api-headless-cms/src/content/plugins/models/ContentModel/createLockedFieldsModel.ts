import { validation } from "@webiny/validation";
import { withFields, string, setOnce, boolean } from "@webiny/commodo";

const requiredShortString = validation.create("required,maxLength:256");

export default () =>
    withFields({
        fieldId: setOnce()(string({ validation: requiredShortString })),
        type: setOnce()(string({ validation: requiredShortString })),
        multipleValues: boolean({ value: false })
    })();
