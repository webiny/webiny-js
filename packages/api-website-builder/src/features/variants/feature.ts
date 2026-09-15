import { createFeature } from "@webiny/feature/api";
import { CreateVariantFeature } from "./CreateVariant/feature.js";
import { UpdateVariantFeature } from "./UpdateVariant/feature.js";
import { DeleteVariantFeature } from "./DeleteVariant/feature.js";
import { GetVariantByIdFeature } from "./GetVariantById/feature.js";
import { ListVariantsFeature } from "./ListVariants/feature.js";

/** Registers every variant use case (CRUD + reads). */
export const VariantFeature = createFeature({
    name: "WebsiteBuilder/Variant",
    register(container) {
        CreateVariantFeature.register(container);
        UpdateVariantFeature.register(container);
        DeleteVariantFeature.register(container);
        GetVariantByIdFeature.register(container);
        ListVariantsFeature.register(container);
    }
});
