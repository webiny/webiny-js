import { createFeature } from "@webiny/feature/admin";
import { SlugifyFeature } from "~/features/slugify/feature.js";
import { StringFormatter } from "./abstractions.js";
import { DefaultStringFormatter } from "./DefaultStringFormatter.js";

export const StringFormatterFeature = createFeature({
    name: "StringFormatter",
    register(container) {
        // Register the transforms the formatter delegates to, then the formatter itself.
        SlugifyFeature.register(container);
        container.register(DefaultStringFormatter).inSingletonScope();
    },
    resolve(container) {
        return {
            stringFormatter: container.resolve(StringFormatter)
        };
    }
});
