import { createFeature } from "@webiny/feature/api";
import { ValuesSelectionGenerator } from "./ValuesSelectionGenerator.js";

export const ValuesSelectionGeneratorFeature = createFeature({
    name: "ValuesSelectionGenerator",
    register(container) {
        container.register(ValuesSelectionGenerator);
    }
});
