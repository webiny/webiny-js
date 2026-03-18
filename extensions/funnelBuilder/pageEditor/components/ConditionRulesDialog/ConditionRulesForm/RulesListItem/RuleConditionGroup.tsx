import React from "react";
import { Button, IconButton, Select, Text, Tooltip } from "webiny/admin/ui";
import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as BasePlusIcon } from "@material-design-icons/svg/outlined/add.svg";

import { FunnelConditionGroupModelDto } from "../../../../../shared/models/FunnelConditionGroupModel";
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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                        justifyContent: "right"
                    }}
                >
                    <Text className={"text-xs"}>Operator:</Text>
                    <Select
                        className={"w-[100px]"}
                        value={conditionGroup.operator}
                        onChange={(value: FunnelConditionGroupModelDto["operator"]) =>
                            updateConditionGroupOperator(conditionGroup.id, value)
                        }
                        options={[
                            { value: "and", label: "AND" },
                            { value: "or", label: "OR" }
                        ]}
                    />
                    <Button
                        variant={"secondary"}
                        size={"sm"}
                        icon={<BasePlusIcon />}
                        text={"Add condition"}
                        onClick={() => addCondition(conditionGroup.id)}
                    />
                    <Button
                        variant={"secondary"}
                        size={"sm"}
                        icon={<BasePlusIcon />}
                        text={"Add group"}
                        onClick={() => addConditionGroup(conditionGroup.id)}
                    />
                    {depth > 1 ? (
                        <IconButton
                            icon={<DeleteIcon />}
                            onClick={() => removeConditionGroup(conditionGroup.id)}
                        />
                    ) : (
                        <Tooltip
                            content={"Cannot delete root condition group."}
                            trigger={
                                <IconButton
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
                    <Typography use={"body2"} style={{ textAlign: "center", padding: "10px" }}>
                        No conditions added yet.
                    </Typography>
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
