import { FunnelSubmissionModel } from "./FunnelSubmissionModel";
import { FunnelConditionModel } from "./FunnelConditionModel";
import { ConditionGroupItem, FunnelConditionGroupModel } from "./FunnelConditionGroupModel";
import { FunnelConditionActionModel } from "./FunnelConditionActionModel";

export class FunnelConditionRulesEvaluator {
    funnelSubmission: FunnelSubmissionModel;

    constructor(funnelSubmission: FunnelSubmissionModel) {
        this.funnelSubmission = funnelSubmission;
    }

    evaluateRelatedConditionRules(): FunnelConditionActionModel[] {
        const actions: FunnelConditionActionModel[] = [];

        // Evaluate each condition rule.
        for (const rule of this.funnelSubmission.funnel.conditionRules) {
            // Check if any of the rule's actions target fields in the active step
            const ruleHasRelevantActions = rule.actions.some(action => action.isApplicable());
            if (!ruleHasRelevantActions) {
                continue;
            }

            const ruleConditionsSatisfied = this.evaluateConditionGroup(rule.conditionGroup);
            if (ruleConditionsSatisfied) {
                actions.push(...rule.actions);
            }
        }

        return actions;
    }

    private evaluateConditionGroup(group: FunnelConditionGroupModel): boolean {
        // If there are no items, return true (empty condition is always satisfied)
        if (group.items.length === 0) {
            return true;
        }

        // Evaluate each item in the group
        const results = group.items.map(item => this.evaluateConditionGroupItem(item));

        // Apply the logical operator
        if (group.operator === "and") {
            return results.every(result => result);
        } else {
            return results.some(result => result);
        }
    }

    private evaluateConditionGroupItem(item: ConditionGroupItem): boolean {
        // If the item is a condition group, evaluate it recursively
        if (item instanceof FunnelConditionGroupModel) {
            return this.evaluateConditionGroup(item);
        }
        // Otherwise, it's a condition, so evaluate it
        return this.evaluateCondition(item);
    }

    private evaluateCondition(condition: FunnelConditionModel): boolean {
        // Get the field from the submission
        const field = this.funnelSubmission.getFieldById(condition.sourceFieldId);
        if (!field) {
            return false;
        }

        return condition.operator.evaluate(field.value);
    }
}
