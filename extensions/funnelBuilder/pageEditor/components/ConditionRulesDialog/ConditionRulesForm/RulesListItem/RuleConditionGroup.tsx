import React from "react";
import { Button, IconButton, Select, Text, Tooltip } from "webiny/admin/ui";
import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as BasePlusIcon } from "@material-design-icons/svg/outlined/add.svg";

import { FunnelConditionGroupModelDto } from "../../../../../models/FunnelConditionGroupModel";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { RuleCondition } from "./RuleCondition";

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid #ebeaeb;
    padding: 5px 0;
`;

const NoConditionsMessage = styled.div`
    padding: 10px;
`;

interface RuleConditionGroupProps {
    conditionGroup: FunnelConditionGroupModelDto;
    depth?: number;
}

export const RuleConditionGroup = ({ conditionGroup, depth = 1 }: RuleConditionGroupProps) => {
    const { addCondition, updateConditionGroupOperator, addConditionGroup, removeConditionGroup } =
        useConditionRulesForm();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 40 * (depth - 1)
            }}
        >
            <Header>
                <Text className={"text-xs font-medium uppercase tracking-widest"}>Conditions</Text>
                <div className={"flex items-center gap-xs flex-1 justify-end"}>
                    <Text className={"text-xs"}>Operator:</Text>
                    <div className={"w-[120px]"}>
                        <Select
                            displayResetAction={false}
                            size={"md"}
                            value={conditionGroup.operator}
                            onChange={value =>
                                updateConditionGroupOperator(
                                    conditionGroup.id,
                                    value as FunnelConditionGroupModelDto["operator"]
                                )
                            }
                            options={[
                                { value: "and", label: "AND" },
                                { value: "or", label: "OR" }
                            ]}
                        />
                    </div>

                    <Button
                        variant={"ghost"}
                        size={"md"}
                        icon={<BasePlusIcon />}
                        text={"Add condition"}
                        onClick={() => addCondition(conditionGroup.id)}
                    />
                    <Button
                        variant={"ghost"}
                        size={"md"}
                        icon={<BasePlusIcon />}
                        text={"Add group"}
                        onClick={() => addConditionGroup(conditionGroup.id)}
                    />
                    {depth > 1 ? (
                        <IconButton
                            variant={"ghost"}
                            icon={<DeleteIcon />}
                            onClick={() => removeConditionGroup(conditionGroup.id)}
                        />
                    ) : (
                        <Tooltip
                            content={"Cannot delete root condition group."}
                            trigger={
                                <IconButton
                                    variant={"tertiary"}
                                    disabled={true}
                                    icon={<DeleteIcon />}
                                    onClick={() => removeConditionGroup(conditionGroup.id)}
                                />
                            }
                        />
                    )}
                </div>
            </Header>

            {conditionGroup.items.length === 0 ? (
                <NoConditionsMessage>
                    <p className={"text-sm text-center py-2.5"}>No conditions added yet.</p>
                </NoConditionsMessage>
            ) : (
                conditionGroup.items.map(conditionGroupItem => {
                    const isConditionGroup = "items" in conditionGroupItem;
                    if (isConditionGroup) {
                        return (
                            <RuleConditionGroup
                                conditionGroup={conditionGroupItem}
                                key={conditionGroupItem.id}
                                depth={depth + 1}
                            />
                        );
                    }

                    return (
                        <RuleCondition
                            condition={conditionGroupItem}
                            conditionGroup={conditionGroup}
                            key={conditionGroupItem.id}
                        />
                    );
                })
            )}
        </div>
    );
};
