import React from "react";
import { Accordion, Button } from "webiny/admin/ui";
import { useConditionRulesForm } from "../useConditionRulesForm";
import styled from "@emotion/styled";
import { ReactComponent as BasePlusIcon } from "@material-design-icons/svg/outlined/add.svg";
import EmptyView from "@webiny/app-admin/components/EmptyView";

const PlusIcon = styled(BasePlusIcon)`
    fill: white;
    width: 16px;
    height: 16px;
    margin-right: 2px;
`;

export interface ConditionRulesFormProps {
    children: React.ReactNode;
}

export const RulesList = ({ children }: ConditionRulesFormProps) => {
    const { rules, addRule } = useConditionRulesForm();

    return (
        <>
            {rules.length > 0 && <Accordion>{children}</Accordion>}

            {rules.length === 0 ? (
                <div style={{ marginTop: 100 }}>
                    <EmptyView
                        title={"No rules added yet. Click the Add Rule button below to add one."}
                        action={
                            <Button
                                variant={"secondary"}
                                icon={<PlusIcon />}
                                text={"Add rule"}
                                onClick={addRule}
                            />
                        }
                    />
                </div>
            ) : (
                <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingTop: 16 }}>
                    <Button
                        variant={"secondary"}
                        icon={<PlusIcon />}
                        text={"Add rule"}
                        onClick={addRule}
                    />
                </div>
            )}
        </>
    );
};
