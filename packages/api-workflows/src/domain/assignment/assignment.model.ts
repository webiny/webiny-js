import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { ASSIGNMENT_MODEL_ID } from "~/constants.js";

/**
 * Private model for the assignment log (spec 4.3). Deleted with its review
 * (DeleteTargetReviewsUseCase).
 */
class AssignmentModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: ASSIGNMENT_MODEL_ID,
                    name: "Workflow Assignment",
                    lifecycleEvents: false
                })
                .fields(fields => ({
                    reviewId: fields.text().label("Review ID"),
                    workflowId: fields.text().label("Workflow ID"),
                    stepId: fields.text().label("Step ID"),
                    userId: fields.text().label("User ID"),
                    assignedOn: fields.datetime().label("Assigned on").withoutTimezone(),
                    source: fields.text().label("Source"),
                    ruleId: fields.text().label("Rule ID"),
                    by: fields
                        .object()
                        .label("By")
                        .fields(byFields => ({
                            type: byFields.text().label("Type"),
                            id: byFields.text().label("ID"),
                            displayName: byFields.text().label("Display name"),
                            identityType: byFields.text().label("Identity type")
                        })),
                    reason: fields.longText().label("Reason"),
                    kind: fields.text().label("Kind")
                }))
        ];
    }
}

export const AssignmentModel = ModelFactory.createImplementation({
    implementation: AssignmentModelImpl,
    dependencies: []
});
