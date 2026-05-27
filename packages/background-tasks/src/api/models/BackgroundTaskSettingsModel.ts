import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import {
    BACKGROUND_TASK_SETTINGS_MODEL_ID,
    BACKGROUND_TASK_MAX_RETENTION_DAYS
} from "~/api/domain/constants.js";

class BackgroundTaskSettingsModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: BACKGROUND_TASK_SETTINGS_MODEL_ID,
                name: "Background Task Settings",
                group: "hidden"
            })
            .description("Global settings for the background tasks system.")
            .titleFieldId("retentionDays")
            .singularApiName("BackgroundTaskSettings")
            .pluralApiName("BackgroundTaskSettings")
            .tags(["$publishing:false", "$hidden:true"])
            .singleEntry();

        model.fields(fields => ({
            retentionDays: fields
                .number()
                .label("Retention (days)")
                .gte(0, "Must be 0 or greater.")
                .lte(
                    BACKGROUND_TASK_MAX_RETENTION_DAYS,
                    `Must be at most ${BACKGROUND_TASK_MAX_RETENTION_DAYS}.`
                )
                .description(
                    `How long to keep completed task runs. 0 = never delete. Max ${BACKGROUND_TASK_MAX_RETENTION_DAYS} days.`
                )
        }));

        return [model];
    }
}

export const BackgroundTaskSettingsModel = ModelFactory.createImplementation({
    implementation: BackgroundTaskSettingsModelFactory,
    dependencies: []
});
