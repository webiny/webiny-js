import React from "react";
import { Button, IconButton, Select, Text } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/delete.svg";
import { ReactComponent as BasePlusIcon } from "webiny/admin/icons/add.svg";

import { FunnelConditionGroupModelDto } from "../../../../../models/FunnelConditionGroupModel";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { RuleCondition } from "./RuleCondition";

interface RuleConditionGroupProps {
    conditionGroup: FunnelConditionGroupModelDto;
    depth?: number;
}

export const RuleConditionGroup = ({ conditionGroup, depth = 1 }: RuleConditionGroupProps) => {
    const { addCondition, updateConditionGroupOperator, addConditionGroup, removeConditionGroup } =
        useConditionRulesForm();

    return (
        <div className={"flex flex-col"} style={{ marginLeft: 40 * (depth - 1) }}>
            <div
                className={
                    "flex justify-between items-center mb-sm border-b border-neutral-dimmed py-xs"
                }
            >
                <Text className={"text-xs font-medium uppercase tracking-widest"}>Conditions</Text>
                <div className={"flex items-center gap-sm flex-1 justify-end"}>
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
                    {depth > 1 && (
                        <IconButton
                            variant={"ghost"}
                            icon={<DeleteIcon />}
                            onClick={() => removeConditionGroup(conditionGroup.id)}
                        />
                    )}
                </div>
            </div>

            {conditionGroup.items.length === 0 ? (
                <div className={"text-sm text-center p-sm"}>No conditions added yet.</div>
            ) : (
                <div className={"flex flex-col gap-sm"}>
                    {conditionGroup.items.map(conditionGroupItem => {
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
                    })}
                </div>
            )}
        </div>
    );
};
