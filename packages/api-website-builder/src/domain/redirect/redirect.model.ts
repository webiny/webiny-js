import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const REDIRECT_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS
    ? "wbRedirect"
    : "wbyWbRedirect";

class RedirectModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: REDIRECT_MODEL_ID,
            name: "Website Builder - Redirect"
        });

        model.fields(fields => ({
            redirectFrom: fields.text().label("Redirect From"),
            redirectTo: fields.text().label("Redirect To"),
            redirectType: fields.text().label("Redirect Type"),
            isEnabled: fields.boolean().label("Is enabled?")
        }));

        return [model];
    }
}

export const RedirectModelPlugin = ModelFactory.createImplementation({
    implementation: RedirectModelFactory,
    dependencies: []
});
