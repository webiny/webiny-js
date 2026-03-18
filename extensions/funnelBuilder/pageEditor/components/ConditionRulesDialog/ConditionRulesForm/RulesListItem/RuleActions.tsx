import React, { useMemo } from "react";
import { Button, IconButton, Select, Text } from "webiny/admin/ui";
import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as PlusIcon } from "@material-design-icons/svg/outlined/add.svg";
import { plugins } from "@webiny/plugins";
import { Form } from "webiny/admin/form";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { FunnelConditionRuleModelDto } from "../../../../../shared/models/FunnelConditionRuleModel";
import { listConditionActions } from "../../../../../shared/models/conditionActions/conditionActionFactory";
import { ConditionOperatorParams } from "../../../../../shared/models/FunnelConditionOperatorModel";
import { ConditionActionParamsComponent } from "../../../plugins/PbEditorFunnelConditionActionPlugin";
import { PbEditorFunnelConditionActionPluginProps } from "../../../plugins/PbEditorFunnelConditionActionPlugin";

const Fieldset = styled.div`
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

    const conditionActionPlugins = useMemo(() => {
        return plugins.byType(
            "pb-editor-funnel-condition-action"
        ) as unknown as PbEditorFunnelConditionActionPluginProps[];
    }, []);

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
                rule.actions.map(action => {
                    const conditionActionPlugin = conditionActionPlugins.find(
                        p => p.actionClass.type === action.type
                    );

                    let ConditionActionParamsComponent: ConditionActionParamsComponent | undefined;
                    if (conditionActionPlugin) {
                        ConditionActionParamsComponent = conditionActionPlugin.settingsRenderer;
                    }

                    return (
                        <Fieldset key={action.id}>
                            <Select
                                className={"w-[200px]"}
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

                            {ConditionActionParamsComponent && (
                                <Form<ConditionOperatorParams>
                                    data={action.params}
                                    onChange={params => {
                                        return updateAction(rule.id, {
                                            ...action,
                                            params
                                        });
                                    }}
                                >
                                    {() => {
                                        return (
                                            <>
                                                {ConditionActionParamsComponent ? (
                                                    <ConditionActionParamsComponent
                                                        funnel={funnel}
                                                    />
                                                ) : null}
                                            </>
                                        );
                                    }}
                                </Form>
                            )}
                            <IconButton
                                icon={<DeleteIcon />}
                                onClick={() => removeAction(rule.id, action.id!)}
                            />
                        </Fieldset>
                    );
                })
            )}
        </div>
    );
};
