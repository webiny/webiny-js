import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

export { WORKFLOW_MODEL_ID };

class WorkflowModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private()
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
                        .fields(fields => ({
                            id: fields.text().label("ID").required("ID is required."),
                            title: fields.text().label("Title").required("Title is required."),
                            color: fields.text().label("Color"),
                            description: fields.text().label("Description"),
                            teams: fields
                                .object()
                                .label("Teams")
                                .list()
                                .fields(teamFields => ({
                                    id: teamFields.text().label("ID").required("ID is required.")
                                })),
                            notifications: fields
                                .object()
                                .list()
                                .label("Notifications")
                                .fields(fields => ({
                                    id: fields.text().label("Id").required("Id is required.")
                                }))
                        }))
                }))
        ];
    }
}

export const WorkflowModel = ModelFactory.createImplementation({
    implementation: WorkflowModelImpl,
    dependencies: []
});
