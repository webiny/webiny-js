import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WorkflowStateRecordState } from "~/domain/workflowState/abstractions.js";

export const WORKFLOW_STATE_MODEL_ID = "wbyWorkflowState";

const states = [
    {
        label: "Pending",
        value: WorkflowStateRecordState.pending
    },
    {
        label: "In Review",
        value: WorkflowStateRecordState.inReview
    },
    {
        label: "Approved",
        value: WorkflowStateRecordState.approved
    },
    {
        label: "Rejected",
        value: WorkflowStateRecordState.rejected
    }
];

class WorkflowStateModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_STATE_MODEL_ID,
                    name: "Workflow State"
                })
                .fields(fields => ({
                    workflowId: fields.text().label("Workflow ID"),
                    app: fields.text().label("App").required("App is required."),
                    title: fields.text().label("Title").required("Title is required."),
                    targetRevisionId: fields.text().label("Target Revision ID"),
                    targetId: fields.text().label("Target ID"),
                    isActive: fields.boolean().label("Is Active"),
                    comment: fields.text().label("Comment"),
                    state: fields.text().label("State").predefinedValues(states),
                    steps: fields
                        .object()
                        .label("Steps")
                        .list()
                        .required("Steps are required.")
                        .listMinLength(1, "At least one step is required.")
                        .fields(stepFields => ({
                            id: stepFields.text().label("ID").required("ID is required."),
                            title: stepFields.text().label("Title").required("Title is required."),
                            color: stepFields.text().label("Color").required("Color is required."),
                            description: stepFields.text().label("Description"),
                            teams: stepFields
                                .object()
                                .label("Teams")
                                .list()
                                .required("At least one team is required.")
                                .listMinLength(1, "At least one team is required.")
                                .fields(teamFields => ({
                                    id: teamFields.text().label("ID").required("ID is required.")
                                })),
                            notifications: stepFields
                                .object()
                                .label("Notifications")
                                .list()
                                .fields(notificationFields => ({
                                    id: notificationFields
                                        .text()
                                        .label("ID")
                                        .required("ID is required.")
                                })),
                            state: stepFields.text().label("State").predefinedValues(states),
                            savedBy: stepFields
                                .object()
                                .label("User")
                                .fields(userFields => ({
                                    id: userFields.text().label("ID").required("ID is required."),
                                    displayName: userFields
                                        .text()
                                        .label("Display Name")
                                        .required("Display name is required."),
                                    type: userFields
                                        .text()
                                        .label("Type")
                                        .required("Type is required.")
                                })),
                            comment: stepFields.text().label("Comment")
                        }))
                }))
        ];
    }
}

export const WorkflowStateModel = ModelFactory.createImplementation({
    implementation: WorkflowStateModelImpl,
    dependencies: []
});
