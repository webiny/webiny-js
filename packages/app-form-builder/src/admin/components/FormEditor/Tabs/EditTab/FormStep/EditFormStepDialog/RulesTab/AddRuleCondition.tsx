import React, { useCallback } from "react";
import { mdbid } from "@webiny/utils";

import { AddConditionButton } from "~/admin/components/FormEditor/Tabs/EditTab/Styled";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add_circle_outline.svg";

import { FbFormRule } from "~/types";

interface EmptyRuleProps {
    rule: FbFormRule;
    onChange: (value: FbFormRule) => void;
}

export const AddRuleCondition = ({ rule, onChange }: EmptyRuleProps) => {
    const onCreateCondition = useCallback(() => {
        return onChange({
            ...rule,
            conditions: [
                ...(rule.conditions || []),
                {
                    fieldName: "",
                    filterType: "",
                    filterValue: "",
                    id: mdbid()
                }
            ]
        });
    }, [onChange, rule]);

    return (
        <AddConditionButton onClick={onCreateCondition}>
            <IconButton icon={<AddIcon />} />
        </AddConditionButton>
    );
};
