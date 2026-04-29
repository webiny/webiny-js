import { createFeature } from "@webiny/feature/api";
import { CodeMailerSettings } from "./CodeMailerSettingsImpl.js";

export const CodeMailerSettingsFeature = createFeature({
    name: "Mailer/CodeMailerSettings",
    register(container) {
        container.register(CodeMailerSettings).inSingletonScope();
    }
});
