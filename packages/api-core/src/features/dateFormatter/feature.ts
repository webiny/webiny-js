import { createFeature } from "@webiny/feature/api";
import { DefaultDateFormatter } from "./DefaultDateFormatter.js";

export const DateFormatterFeature = createFeature({
    name: "DateFormatterFeature",
    register(container) {
        container.register(DefaultDateFormatter);
    }
});
