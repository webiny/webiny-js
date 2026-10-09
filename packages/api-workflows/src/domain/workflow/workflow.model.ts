import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * Private model for workflows (spec 4.1). Validation lives in `WorkflowValidator`; the step
 * `config` is JSON so new step types need no model change.
 */
class WorkflowModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_MODEL_ID,
                    name: "Workflow"
                })
                .fields(fields => ({
                    name: fields.text().label("Name"),
                    models: fields.text().label("Models").list(),
                    steps: fields
                        .object()
                        .label("Steps")
                        .list()
                        .fields(stepFields => ({
                            id: stepFields.text().label("ID"),
                            title: stepFields.text().label("Title"),
                            color: stepFields.text().label("Color"),
                            description: stepFields.longText().label("Description"),
                            type: stepFields.text().label("Type"),
                            notifications: stepFields
                                .object()
                                .label("Notifications")
                                .list()
                                .fields(notificationFields => ({
                                    id: notificationFields.text().label("ID")
                                })),
                            config: stepFields.json().label("Config")
                        }))
                }))
        ];
    }
}

export const WorkflowModel = ModelFactory.createImplementation({
    implementation: WorkflowModelImpl,
    dependencies: []
});
