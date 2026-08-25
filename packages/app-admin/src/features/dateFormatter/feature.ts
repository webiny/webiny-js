import { createFeature } from "@webiny/feature/admin";
import { DateFormatter } from "./abstractions.js";
import { DefaultDateFormatter } from "./DefaultDateFormatter.js";

export const DateFormatterFeature = createFeature({
    name: "DateFormatter",
    register(container) {
        container.register(DefaultDateFormatter).inSingletonScope();
    },
    resolve(container) {
        return {
            formatter: container.resolve(DateFormatter)
        };
    }
});
