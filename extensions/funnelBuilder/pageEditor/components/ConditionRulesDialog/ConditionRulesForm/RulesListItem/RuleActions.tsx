import React from "react";
import { Button, IconButton, Select, Text } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as PlusIcon } from "@material-design-icons/svg/outlined/add.svg";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { FunnelConditionRuleModelDto } from "../../../../../models/FunnelConditionRuleModel";
import { listConditionActions } from "../../../../../models/conditionActions/conditionActionFactory";

export interface RuleActionsProps {
    rule: FunnelConditionRuleModelDto;
}

export const RuleActions = ({ rule }: RuleActionsProps) => {
    const { addAction, removeAction, updateAction } = useConditionRulesForm();

    const availableConditionActions = listConditionActions();

    return (
        <div className={"flex flex-col"}>
            <div
                className={
                    "flex justify-between items-center mb-sm border-b border-neutral-dimmed py-xs"
                }
            >
                <Text className={"text-xs font-medium uppercase tracking-widest"}>Actions</Text>
                <Button
                    variant={"secondary"}
                    icon={<PlusIcon />}
                    text={"Add action"}
                    onClick={() => addAction(rule.id)}
                />
            </div>

            {rule.actions.length === 0 ? (
                <div className={"p-2.5"}>
                    <Text className={"block text-sm text-center p-sm"}>No actions added yet.</Text>
                </div>
            ) : (
                <div className={"flex flex-col gap-sm"}>
                    {rule.actions.map(action => (
                        <div key={action.id} className={"flex items-center gap-sm relative w-full"}>
                            <Select
                                placeholder={"Select action..."}
                                displayResetAction={false}
                                size={"md"}
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
