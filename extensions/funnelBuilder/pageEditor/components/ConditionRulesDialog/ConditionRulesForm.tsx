import React from "react";
import { useConditionRulesForm } from "./useConditionRulesForm";
import { RulesListItem } from "./ConditionRulesForm/RulesListItem";
import { RulesList } from "./ConditionRulesForm/RulesList";

export const ConditionRulesForm = () => {
    const { rules } = useConditionRulesForm();

    return (
        <RulesList>
            {rules.map(rule => (
                <RulesListItem key={rule.id} rule={rule} />
            ))}
        </RulesList>
    );
};
