import React, { useMemo } from "react";
import { Accordion, IconButton } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { useConditionRulesForm } from "../useConditionRulesForm";
import { FunnelConditionRuleModelDto } from "../../../../shared/models/FunnelConditionRuleModel";
import { RuleConditionGroup } from "./RulesListItem/RuleConditionGroup";
import { RuleActions } from "./RulesListItem/RuleActions";

interface RulesListItemProps {
    rule: FunnelConditionRuleModelDto;
}

export const RulesListItem = ({ rule }: RulesListItemProps) => {
    const { getRuleIndex, removeRule, getConditionsCount, getActionsCount } =
        useConditionRulesForm();
    const ruleIndex = getRuleIndex(rule);

    const conditionsCount = getConditionsCount(rule.id);
    const actionsCount = getActionsCount(rule.id);
    const description = useMemo(() => {
        return [
            conditionsCount || "No",
            conditionsCount === 1 ? "condition," : "conditions,",
            actionsCount || "no",
            actionsCount === 1 ? "action" : "actions"
        ].join(" ");
    }, [conditionsCount, actionsCount]);

    return (
        <Accordion.Item
            interactive={false}
            open={true}
            description={description}
            title={`Rule ${ruleIndex + 1}`}
            actions={<IconButton onClick={() => removeRule(rule.id)} icon={<DeleteIcon />} />}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Root condition group is passed here. The component can
                    then also render nested condition groups. */}
                <RuleConditionGroup conditionGroup={rule.conditionGroup} />
                <RuleActions rule={rule} />
            </div>
        </Accordion.Item>
    );
};
