import React, { useCallback } from "react";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";
import { FbFormRule } from "~/types";

const RuleAction = styled("div")`
    display: flex;
    align-items: center;
    margin-top: 70px;
    position: relative;
    & > span {
        font-size: 22px;
    }
    &::before {
        display: block;
        content: "";
        width: 100%;
        position: absolute;
        top: -25px;
        border-top: 1px solid gray;
    }
`;

const ActionSelect = styled(Select)`
    margin-right: 15px;
`;

interface Props {
    rule: FbFormRule;
    onChange: (params: FbFormRule) => void;
}

export const RuleActionSelect = ({ rule, onChange }: Props) => {
    const onChangeAction = useCallback(
        (value: string) => {
            return onChange({
                ...rule,
                action: {
                    type: "",
                    value
                }
            });
        },
        [rule.action.value, onChange]
    );

    return (
        <RuleAction>
            <ActionSelect
                label="Select rule action"
                placeholder="Select rule action"
                value={rule.action.value}
                onChange={onChangeAction}
            >
                <option value={"show"}>Show fields</option>
                <option value={"hide"}>Hide fields</option>
            </ActionSelect>
        </RuleAction>
    );
};
