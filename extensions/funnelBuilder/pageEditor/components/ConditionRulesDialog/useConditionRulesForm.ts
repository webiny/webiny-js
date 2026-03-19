import { useBind, useForm } from "webiny/admin/form";
import { getRandomId } from "../../../utils/getRandomId";
import { FunnelModelDto } from "../../../models/FunnelModel";
import { FunnelConditionRuleModelDto } from "../../../models/FunnelConditionRuleModel";
import { FunnelConditionModelDto } from "../../../models/FunnelConditionModel";
import { FunnelConditionActionModelDto } from "../../../models/FunnelConditionActionModel";
import { DisableFieldConditionAction } from "../../../models/conditionActions/DisableFieldConditionAction";
import {
    FunnelConditionGroupModelDto,
    LogicalOperator
} from "../../../models/FunnelConditionGroupModel";

type ConditionRulesDto = FunnelConditionRuleModelDto[];

const findConditionGroup = (
    conditionGroupId: string,
    rootConditionGroup: FunnelConditionGroupModelDto
): FunnelConditionGroupModelDto | null => {
    if (rootConditionGroup.id === conditionGroupId) {
        return rootConditionGroup;
    }

    for (const item of rootConditionGroup.items) {
        if ("sourceFieldId" in item) {
            continue;
        }
        const found = findConditionGroup(conditionGroupId, item);
        if (found) {
            return found;
        }
    }

    return null;
};

const findParentConditionGroup = (
    conditionGroupId: string,
    rootConditionGroup: FunnelConditionGroupModelDto
): FunnelConditionGroupModelDto | null => {
    for (const item of rootConditionGroup.items) {
        if ("sourceFieldId" in item) {
            continue;
        }
        if (item.id === conditionGroupId) {
            return rootConditionGroup;
        }
        const found = findParentConditionGroup(conditionGroupId, item);
        if (found) {
            return found;
        }
    }

    return null;
};

export const useConditionRulesForm = () => {
    // Get the condition rules from the model
    const { data: funnel } = useForm<FunnelModelDto>();
    const conditionRulesBind = useBind({ name: "conditionRules" });

    const rules = conditionRulesBind.value as ConditionRulesDto;

    // Rules. 👇
    const updateRules = (updateFn: (rulesClone: ConditionRulesDto) => ConditionRulesDto) => {
        conditionRulesBind.onChange(updateFn(structuredClone(rules)));
    };

    const addRule = () => {
        updateRules(rules => {
            return rules.concat({
                id: getRandomId(),
                conditionGroup: { id: getRandomId(), items: [], operator: "and" },
                actions: []
            });
        });
    };

    const removeRule = (ruleId: string) => {
        updateRules(rules => {
            return rules.filter(rule => rule.id !== ruleId);
        });
    };

    const getRuleIndex = (rule: FunnelConditionRuleModelDto) => {
        return funnel.conditionRules.findIndex(current => {
            return current.id === rule.id;
        });
    };

    // Conditions. 👇
    const addCondition = (conditionGroupId: string) => {
        updateRules(rules => {
            for (const rule of rules) {
                const rootConditionGroup = rule.conditionGroup;
                const groupInRule = findConditionGroup(conditionGroupId, rootConditionGroup);
                if (groupInRule) {
                    groupInRule.items.push({
                        id: getRandomId(),
                        sourceFieldId: "",
                        operator: { type: "empty" }
                    } as FunnelConditionModelDto);
                    break;
                }
            }

            return rules;
        });
    };

    const removeCondition = (conditionGroupId: string, conditionId: string) => {
        updateRules(rules => {
            for (const rule of rules) {
                const rootConditionGroup = rule.conditionGroup;
                const groupInRule = findConditionGroup(conditionGroupId, rootConditionGroup);
                if (groupInRule) {
                    groupInRule.items = groupInRule.items.filter(
                        condition => condition.id !== conditionId
                    );
                    break;
                }
            }

            return rules;
        });
    };

    const updateCondition = (conditionGroupId: string, condition: FunnelConditionModelDto) => {
        updateRules(rules => {
            for (const rule of rules) {
                const rootConditionGroup = rule.conditionGroup;
                const groupInRule = findConditionGroup(conditionGroupId, rootConditionGroup);
                if (groupInRule) {
                    const conditionInItems = groupInRule.items.find(
                        item => item.id === condition.id
                    );

                    if (conditionInItems && "sourceFieldId" in conditionInItems) {
                        conditionInItems.sourceFieldId = condition.sourceFieldId;
                        conditionInItems.operator = condition.operator;
                    }

                    break;
                }
            }

            return rules;
        });
    };

    const getConditionsCount = (ruleId: string) => {
        const rule = rules.find(rule => rule.id === ruleId);
        if (!rule) {
            return 0;
        }

        let count = 0;
        const traverseConditionGroup = (conditionGroup: FunnelConditionGroupModelDto) => {
            for (const item of conditionGroup.items) {
                if ("sourceFieldId" in item) {
                    count++;
                } else {
                    traverseConditionGroup(item);
                }
            }
        };

        traverseConditionGroup(rule.conditionGroup);
        return count;
    };

    // Condition groups.👇
    const updateConditionGroupOperator = (conditionGroupId: string, operator: LogicalOperator) => {
        updateRules(rules => {
            for (const rule of rules) {
                const rootConditionGroup = rule.conditionGroup;
                const groupInRule = findConditionGroup(conditionGroupId, rootConditionGroup);
                if (groupInRule) {
                    groupInRule.operator = operator;
                    break;
                }
            }

            return rules;
        });
    };

    const addConditionGroup = (conditionGroupId: string) => {
        updateRules(rules => {
            for (const rule of rules) {
                const rootConditionGroup = rule.conditionGroup;
                const groupInRule = findConditionGroup(conditionGroupId, rootConditionGroup);
                if (groupInRule) {
                    groupInRule.items.push({
                        id: getRandomId(),
                        operator: "and",
                        items: []
                    });
                    break;
                }
            }

            return rules;
        });
    };

    const removeConditionGroup = (conditionGroupId: string) => {
        updateRules(rules => {
            for (const rule of rules) {
                const rootConditionGroup = rule.conditionGroup;
                const groupInRule = findConditionGroup(conditionGroupId, rootConditionGroup);
                if (groupInRule) {
                    const parentGroup = findParentConditionGroup(
                        conditionGroupId,
                        rootConditionGroup
                    );
                    if (parentGroup) {
                        parentGroup.items = parentGroup.items.filter(
                            group => group.id !== conditionGroupId
                        );
                    }
                    break;
                }
            }

            return rules;
        });
    };

    const addAction = (ruleId: string) => {
        updateRules(rules => {
            const rule = rules.find(rule => rule.id === ruleId);

            if (!rule) {
                return rules;
            }

            rule.actions.push({
                id: getRandomId(),
                type: DisableFieldConditionAction.type,
                params: { extra: {} }
            });

            return rules;
        });
    };

    const removeAction = (ruleId: string, actionId: string) => {
        updateRules(rules => {
            const rule = rules.find(rule => rule.id === ruleId);

            if (!rule) {
                return rules;
            }

            rule.actions = rule.actions.filter(action => action.id !== actionId);

            return rules;
        });
    };

    const updateAction = (ruleId: string, action: FunnelConditionActionModelDto) => {
        updateRules(rules => {
            const rule = rules.find(current => current.id === ruleId);
            if (!rule) {
                return rules;
            }

            const ruleAction = rule.actions.find(current => current.id === action.id);
            if (!ruleAction) {
                return rules;
            }

            ruleAction.type = action.type;
            ruleAction.params = action.params;

            return rules;
        });
    };

    const getActionsCount = (ruleId: string) => {
        const rule = rules.find(rule => rule.id === ruleId);
        if (!rule) {
            return 0;
        }

        return rule.actions.length;
    };

    return {
        addCondition,
        removeCondition,
        updateCondition,
        getConditionsCount,
        updateRules,
        updateConditionGroupOperator,
        addRule,
        removeRule,
        getRuleIndex,
        addConditionGroup,
        removeConditionGroup,
        addAction,
        removeAction,
        updateAction,
        getActionsCount,
        funnel,
        rules
    };
};
