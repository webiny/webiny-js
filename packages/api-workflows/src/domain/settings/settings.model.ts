import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_SETTINGS_MODEL_ID } from "~/constants.js";

/** Private model for tenant workflow settings (spec 4.4); one entry per tenant. */
class WorkflowSettingsModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_SETTINGS_MODEL_ID,
                    name: "Workflow Settings",
                    lifecycleEvents: false
                })
                .fields(fields => ({
                    exclusions: fields
                        .object()
                        .label("Exclusions")
                        .list()
                        .fields(exclusionFields => ({
                            userId: exclusionFields.text().label("User ID"),
                            reason: exclusionFields.longText().label("Reason"),
                            endsOn: exclusionFields.datetime().label("Ends on").withoutTimezone()
                        }))
                }))
        ];
    }
}

export const WorkflowSettingsModel = ModelFactory.createImplementation({
    implementation: WorkflowSettingsModelImpl,
    dependencies: []
});
