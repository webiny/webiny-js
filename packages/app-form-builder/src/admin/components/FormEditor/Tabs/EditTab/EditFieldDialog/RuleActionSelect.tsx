import React from "react";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";

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
    margin-left: 35px;
    margin-right: 15px;
    width: 250px;
`;

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export const RuleActionSelect: React.FC<Props> = ({ value, onChange }) => {
    return (
        <RuleAction>
            <span>Then</span>
            <ActionSelect
                label="Select rule action"
                placeholder="Select rule action"
                value={value}
                onChange={onChange}
            >
                <option value={"show"}>Show fields</option>
                <option value={"hide"}>Hide fields</option>
            </ActionSelect>
        </RuleAction>
    );
};
