import { createFeature } from "@webiny/feature/admin";
import { CmsFormModelBuilder as CmsFormModelBuilderAbstraction } from "./abstractions.js";
import { CmsFieldTypeMapper } from "./abstractions.js";
import { CmsFormModelBuilderImpl } from "./CmsFormModelBuilder.js";
import { CmsRefFieldType } from "./CmsRefFieldType.js";
import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";

export const CmsFormModelFeature = createFeature({
    name: "CmsFormModel",
    register(container) {
        // Getters rather than resolved lists, so a renderer registered later still reaches forms.
        const builder = new CmsFormModelBuilderImpl(
            () => container.resolveAll(CmsFieldTypeMapper),
            () => container.resolveAll(CmsFieldRenderer)
        );
        container.registerInstance(CmsFormModelBuilderAbstraction, builder);
        container.register(CmsRefFieldType);
    },
    resolve(container) {
        return {
            builder: container.resolve(CmsFormModelBuilderAbstraction)
        };
    }
});
