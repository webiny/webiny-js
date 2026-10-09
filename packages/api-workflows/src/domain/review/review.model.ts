import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { REVIEW_MODEL_ID } from "~/constants.js";

/**
 * Private model for reviews (spec 4.2). Current-step fields are top-level so lists and least-loaded
 * can query them (D19); `targetContext` is an object so lists can filter by folder (phase 3).
 * The requester is stored as `requester` because `createdBy` is a reserved CMS field id.
 */
class ReviewModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: REVIEW_MODEL_ID,
                    name: "Workflow Review"
                })
                .fields(fields => ({
                    workflowId: fields.text().label("Workflow ID"),
                    model: fields.text().label("Model"),
                    targetId: fields.text().label("Target ID"),
                    targetRevisionId: fields.text().label("Target revision ID"),
                    title: fields.text().label("Title"),
                    isActive: fields.boolean().label("Is active"),
                    state: fields.text().label("State"),
                    currentStepId: fields.text().label("Current step ID"),
                    currentStepState: fields.text().label("Current step state"),
                    currentOwnerId: fields.text().label("Current owner ID"),
                    currentCandidateTeamIds: fields
                        .text()
                        .label("Current candidate team IDs")
                        .list(),
                    targetContext: fields
                        .object()
                        .label("Target context")
                        .fields(contextFields => ({
                            folder: contextFields
                                .object()
                                .label("Folder")
                                .fields(folderFields => ({
                                    id: folderFields.text().label("ID"),
                                    type: folderFields.text().label("Type")
                                })),
                            modelId: contextFields.text().label("Model ID"),
                            title: contextFields.text().label("Title"),
                            author: contextFields
                                .object()
                                .label("Author")
                                .fields(authorFields => ({
                                    id: authorFields.text().label("ID"),
                                    displayName: authorFields.text().label("Display name")
                                }))
                        })),
                    workflow: fields
                        .object()
                        .label("Workflow")
                        .fields(workflowFields => ({
                            name: workflowFields.text().label("Name"),
                            models: workflowFields.text().label("Models").list()
                        })),
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
                            config: stepFields.json().label("Config"),
                            state: stepFields.text().label("State"),
                            owner: stepFields
                                .object()
                                .label("Owner")
                                .fields(ownerFields => ({
                                    type: ownerFields.text().label("Type"),
                                    id: ownerFields.text().label("ID"),
                                    displayName: ownerFields.text().label("Display name"),
                                    identityType: ownerFields.text().label("Identity type")
                                })),
                            comment: stepFields.longText().label("Comment"),
                            pickedUserId: stepFields.text().label("Picked user ID"),
                            candidateTeamIds: stepFields.text().label("Candidate team IDs").list(),
                            assignmentSource: stepFields.text().label("Assignment source"),
                            assignment: stepFields
                                .object()
                                .label("Assignment")
                                .fields(assignmentFields => ({
                                    source: assignmentFields.text().label("Source"),
                                    ruleId: assignmentFields.text().label("Rule ID"),
                                    reason: assignmentFields.longText().label("Reason"),
                                    by: assignmentFields
                                        .object()
                                        .label("By")
                                        .fields(byFields => ({
                                            type: byFields.text().label("Type"),
                                            id: byFields.text().label("ID"),
                                            displayName: byFields.text().label("Display name"),
                                            identityType: byFields.text().label("Identity type")
                                        }))
                                })),
                            reachedOn: stepFields.datetime().label("Reached on").withoutTimezone(),
                            startedOn: stepFields.datetime().label("Started on").withoutTimezone(),
                            finishedOn: stepFields.datetime().label("Finished on").withoutTimezone()
                        })),
                    requester: fields
                        .object()
                        .label("Requester")
                        .fields(requesterFields => ({
                            type: requesterFields.text().label("Type"),
                            id: requesterFields.text().label("ID"),
                            displayName: requesterFields.text().label("Display name"),
                            identityType: requesterFields.text().label("Identity type")
                        })),
                    lastChangedOn: fields.datetime().label("Last changed on").withoutTimezone()
                }))
        ];
    }
}

export const ReviewModel = ModelFactory.createImplementation({
    implementation: ReviewModelImpl,
    dependencies: []
});
