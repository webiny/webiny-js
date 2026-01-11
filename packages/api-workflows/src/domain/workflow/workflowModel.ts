import { PrivateModel } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

export { WORKFLOW_MODEL_ID };

class WorkflowModelImpl implements PrivateModel.Interface {
    buildModel(builder: PrivateModel.Builder): PrivateModel.Builder {
        return builder
            .modelId(WORKFLOW_MODEL_ID)
            .name("Workflow")
            .fields(fields => ({
                name: fields.text().label("Name").required("Workflow name is required."),
                app: fields.text().label("App").required("App is required."),
                steps: fields
                    .object()
                    .label("Steps")
                    .list()
                    .required("Steps are required.")
                    .listMinLength(1, "At least one step is required.")
                    .fields(stepFields => ({
                        id: stepFields.text().label("ID").required("ID is required."),
                        title: stepFields.text().label("Title").required("Title is required."),
                        color: stepFields.text().label("Color"),
                        description: stepFields.text().label("Description"),
                        teams: stepFields
                            .object()
                            .label("Teams")
                            .list()
                            .fields(teamFields => ({
                                id: teamFields.text().label("ID").required("ID is required.")
                            })),
                        notifications: stepFields
                            .object()
                            .label("Notifications")
                            .fields(notificationFields => ({
                                enabled: notificationFields.boolean().label("Enabled")
                            }))
                    }))
            }));
    }
}

export const WorkflowModel = PrivateModel.createImplementation({
    implementation: WorkflowModelImpl,
    dependencies: []
});
