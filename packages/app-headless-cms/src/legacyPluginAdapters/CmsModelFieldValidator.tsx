import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type { CmsModelFieldValidatorPlugin } from "@webiny/app-headless-cms-common/types/validation.js";

type CmsModelFieldValidatorProps = Pick<CmsModelFieldValidatorPlugin, "validator">;

export const CmsModelFieldValidator = (props: CmsModelFieldValidatorProps) => {
    useEffect(() => {
        plugins.register({
            type: "cms-model-field-validator",
            name: `cms-model-field-validator-${props.validator.name}`,
            validator: props.validator
        } satisfies CmsModelFieldValidatorPlugin);
    }, []);
    return null;
};
