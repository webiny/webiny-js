import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const THEME_MODEL_ID = "wbyTheme";

/**
 * The theme is stored as a private CMS entry, which gives us revisions, a published/live pointer and
 * locking for free — the same mechanism Website Builder pages use. Private means it is invisible to
 * the CMS GraphQL endpoint and the CMS UI; the Theme app's own schema is the only way in.
 *
 * `resolved` is plain json rather than searchableJson: it is a large frozen blob read by id, never
 * filtered on, and indexing it would cost storage for no query we intend to run.
 */
class ThemeModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: THEME_MODEL_ID,
            name: "Theme"
        });

        model.fields(fields => ({
            properties: fields.searchableJson().label("Properties"),
            tokens: fields.json().label("Tokens"),
            policy: fields.json().label("Policy"),
            settings: fields.json().label("Settings"),
            resolved: fields.json().label("Resolved snapshot"),
            metadata: fields.searchableJson().label("Metadata"),
            extensions: fields.searchableJson().label("Extensions"),
            // Free-text notes the author writes when publishing a version — "what changed", shown in
            // the version history. Per-revision: written onto the revision as it is frozen.
            publishComment: fields.longText().label("Publish comment")
        }));

        return [model];
    }
}

export const ThemeModelPlugin = ModelFactory.createImplementation({
    implementation: ThemeModelFactory,
    dependencies: []
});
