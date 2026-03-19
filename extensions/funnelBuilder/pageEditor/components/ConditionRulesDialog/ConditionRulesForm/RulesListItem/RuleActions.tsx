import React from "react";
import { Button, IconButton, Select, Text } from "webiny/admin/ui";
import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as PlusIcon } from "@material-design-icons/svg/outlined/add.svg";
import { Form } from "webiny/admin/form";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { FunnelConditionRuleModelDto } from "../../../../../models/FunnelConditionRuleModel";
import { listConditionActions } from "../../../../../models/conditionActions/conditionActionFactory";
import { ConditionOperatorParams } from "../../../../../models/FunnelConditionOperatorModel";

const Fieldset = styled.div`
    width: 200px;
    display: flex;
    align-items: center;
    column-gap: 10px;
    position: relative;
    width: 100%;

    & webiny-form-container {
        flex: 1;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid #ebeaeb;
    padding: 5px 0;
`;

const NoActionsMessage = styled.div`
    padding: 10px;
`;

export interface RuleActionsProps {
    rule: FunnelConditionRuleModelDto;
}

export const RuleActions = ({ rule }: RuleActionsProps) => {
    const { funnel, addAction, removeAction, updateAction } = useConditionRulesForm();

    const availableConditionActions = listConditionActions();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column"
            }}
        >
            <Header>
                <Text className={"text-xs font-medium uppercase tracking-widest"}>Actions</Text>
                <Button
                    variant={"secondary"}
                    icon={<PlusIcon />}
                    text={"Add action"}
                    onClick={() => addAction(rule.id)}
                />
            </Header>

            {rule.actions.length === 0 ? (
                <NoActionsMessage>
                    <Text className={"block text-sm text-center p-[10px]"}>
                        No actions added yet.
                    </Text>
                </NoActionsMessage>
            ) : (
                rule.actions.map(action => (
                    <Fieldset key={action.id}>
                        <Select
                            placeholder={"Select action..."}
                            displayResetAction={false}
                            size={"md"}
                            // className={"w-[200px]"}
                            value={action.type}
                            onChange={type => {
                                updateAction(rule.id, {
                                    id: action.id,
                                    type,
                                    params: { extra: {} }
                                });
                            }}
                            options={availableConditionActions.map(action => ({
                                value: action.type,
                                label: action.optionLabel
                            }))}
                        />
                        <IconButton
                            variant={"ghost"}
                            icon={<DeleteIcon />}
                            onClick={() => removeAction(rule.id, action.id!)}
                        />
                    </Fieldset>
                ))
            )}
        </div>
    );
};
