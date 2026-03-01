import React from "react";
import { Grid, Select, Input, Button, IconButton } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { FieldRule, FieldRuleAction } from "~/types.js";

const ACTION_OPTIONS = [
    { value: "hide", label: "Hide" },
    { value: "disable", label: "Disable" }
];

interface RuleRowProps {
    rule: FieldRule;
    index: number;
    onChange: (index: number, updated: FieldRule) => void;
    onRemove: (index: number) => void;
}

const RuleRow = ({ rule, index, onChange, onRemove }: RuleRowProps) => {
    return (
        <Grid>
            <Grid.Column span={3}>
                <Select
                    displayResetAction={false}
                    label={"Action"}
                    value={rule.action}
                    options={ACTION_OPTIONS}
                    onChange={value => {
                        onChange(index, {
                            ...rule,
                            action: (value ?? "hide") as FieldRuleAction
                        });
                    }}
                />
            </Grid.Column>
            <Grid.Column span={8}>
                <Input
                    label={"Expression"}
                    placeholder={"entry.fieldId > 200"}
                    value={rule.expression}
                    onChange={value => {
                        onChange(index, { ...rule, expression: value ?? "" });
                    }}
                />
            </Grid.Column>
            <Grid.Column span={1}>
                <div className={"flex items-center h-full pt-xs"}>
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => onRemove(index)}
                        variant={"ghost"}
                        size={"sm"}
                    />
                </div>
            </Grid.Column>
        </Grid>
    );
};

export const RulesTab = ({ gridClassName }: { gridClassName?: string }) => {
    const bind = useBind({ name: "rules" });
    const rules: FieldRule[] = bind.value || [];

    const addRule = () => {
        bind.onChange([...rules, { action: "hide" as FieldRuleAction, expression: "" }]);
    };

    const updateRule = (index: number, updated: FieldRule) => {
        const next = [...rules];
        next[index] = updated;
        bind.onChange(next);
    };

    const removeRule = (index: number) => {
        bind.onChange(rules.filter((_, i) => i !== index));
    };

    return (
        <Grid className={gridClassName}>
            <Grid.Column span={12}>
                {rules.map((rule, index) => (
                    <RuleRow
                        key={index}
                        rule={rule}
                        index={index}
                        onChange={updateRule}
                        onRemove={removeRule}
                    />
                ))}
                <div className={"flex justify-center mt-sm"}>
                    <Button
                        onClick={addRule}
                        text={"Add Rule"}
                        icon={<AddIcon />}
                        size={"sm"}
                    />
                </div>
            </Grid.Column>
        </Grid>
    );
};
