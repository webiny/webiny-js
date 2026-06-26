import { createFeature } from "@webiny/feature/admin";
import { CmsFormModelBuilder as CmsFormModelBuilderAbstraction } from "./abstractions.js";
import { CmsFormModelBuilder } from "./CmsFormModelBuilder.js";
import { CmsRefFieldType } from "./CmsRefFieldType.js";
import { CmsAccessControlRuleEvaluator } from "./CmsAccessControlRuleEvaluator.js";

export const CmsFormModelFeature = createFeature({
    name: "CmsFormModel",
    register(container) {
        container.register(CmsFormModelBuilder).inSingletonScope();
        container.register(CmsRefFieldType);
        container.register(CmsAccessControlRuleEvaluator);
    },
    resolve(container) {
        return {
            builder: container.resolve(CmsFormModelBuilderAbstraction)
        };
    }
});
