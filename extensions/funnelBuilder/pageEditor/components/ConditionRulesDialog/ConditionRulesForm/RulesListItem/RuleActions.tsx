import React from "react";
import { Button, IconButton, Select, Text } from "webiny/admin/ui";
import { Form } from "webiny/admin/form";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/delete.svg";
import { ReactComponent as PlusIcon } from "webiny/admin/icons/add.svg";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { FunnelConditionRuleModelDto } from "../../../../../models/FunnelConditionRuleModel";
import { listConditionActions } from "../../../../../models/conditionActions/conditionActionFactory";
import { conditionActions } from "../../../conditionActions/index.js";
import type { ConditionActionParamsDto } from "../../../../../models/FunnelConditionActionModel";

export interface RuleActionsProps {
    rule: FunnelConditionRuleModelDto;
}

export const RuleActions = ({ rule }: RuleActionsProps) => {
    const { funnel, addAction, removeAction, updateAction } = useConditionRulesForm();

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
                    variant={"ghost"}
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
                    {rule.actions.map(action => {
                        const definition = conditionActions.find(d => d.type === action.type);
                        const SettingsComponent = definition?.settingsRenderer;

                        return (
                            <div key={action.id} className={"flex flex-col gap-xs"}>
                                <div className={"flex items-center gap-sm"}>
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
                                        options={availableConditionActions.map(def => ({
                                            value: def.type,
                                            label: def.optionLabel
                                        }))}
                                    />
                                    {SettingsComponent && (
                                        <Form<ConditionActionParamsDto>
                                            data={action.params}
                                            onChange={params => {
                                                updateAction(rule.id, { ...action, params });
                                            }}
                                        >
                                            {() => <SettingsComponent funnel={funnel} />}
                                        </Form>
                                    )}
                                    <IconButton
                                        variant={"ghost"}
                                        icon={<DeleteIcon />}
                                        onClick={() => removeAction(rule.id, action.id!)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
