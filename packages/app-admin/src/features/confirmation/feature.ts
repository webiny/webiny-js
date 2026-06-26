import { createFeature } from "@webiny/feature/admin";
import { Confirmation } from "./Confirmation.js";

export const ConfirmationFeature = createFeature({
    name: "Confirmation",
    register(container) {
        container.register(Confirmation).inSingletonScope();
    }
});
