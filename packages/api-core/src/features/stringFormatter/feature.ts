import { createFeature } from "@webiny/feature/api";
import { SlugifyFeature } from "~/features/slugify/feature.js";
import { DefaultStringFormatter } from "./DefaultStringFormatter.js";

export const StringFormatterFeature = createFeature({
    name: "StringFormatterFeature",
    register(container) {
        // Register the transforms the formatter delegates to, then the formatter itself.
        SlugifyFeature.register(container);
        container.register(DefaultStringFormatter);
    }
});
