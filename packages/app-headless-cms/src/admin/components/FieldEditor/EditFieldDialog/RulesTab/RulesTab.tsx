import React, { useCallback, useMemo } from "react";
import { Grid, Select, Input, Button, Separator } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { FieldRule, FieldRuleAction } from "~/types.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";
import {
    getOperatorOptions,
    VALUE_HIDDEN_OPERATORS
} from "@webiny/app-headless-cms-common/Fields/operatorOptions.js";
import type { Operator } from "@webiny/app-headless-cms-common/Fields/evaluateExpression.js";

const DEFAULT_ACTION_OPTIONS = [
    { value: "hide", label: "Hide" },
    { value: "disable", label: "Disable" }
];

interface ActionOption {
    value: string;
    label: string;
}

interface RuleRowProps {
    rule: FieldRule;
    index: number;
    fieldOptions: FieldOption[];
    actionOptions: ActionOption[];
    onChange: (index: number, updated: FieldRule) => void;
    onRemove: (index: number) => void;
}

const RuleRow = ({
    rule,
    index,
    fieldOptions,
    actionOptions,
    onChange,
    onRemove
}: RuleRowProps) => {
    const selectedFieldOption = useMemo(
        () => fieldOptions.find(o => o.value === rule.target),
        [fieldOptions, rule.target]
    );

    const operatorOptions = useMemo(
        () => (selectedFieldOption ? getOperatorOptions(selectedFieldOption.fieldType) : []),
        [selectedFieldOption]
    );

    const operatorSelectOptions = useMemo(
        () => operatorOptions.map(o => ({ value: o.value, label: o.label })),
        [operatorOptions]
    );

    const fieldSelectOptions = useMemo(
        () => fieldOptions.map(o => ({ value: o.value, label: o.label })),
        [fieldOptions]
    );

    const showValue = rule.operator && !VALUE_HIDDEN_OPERATORS.has(rule.operator as Operator);

    const handleFieldChange = useCallback(
        (value: string | null) => {
            const newTarget = value ?? "";
            const newFieldOption = fieldOptions.find(o => o.value === newTarget);
            // Reset operator and value when field changes
            const newOps = newFieldOption ? getOperatorOptions(newFieldOption.fieldType) : [];
            const currentOpValid = newOps.some(o => o.value === rule.operator);
            onChange(index, {
                ...rule,
                target: newTarget,
                operator: currentOpValid ? rule.operator : "",
                value: currentOpValid ? rule.value : null
            });
        },
        [fieldOptions, rule, index, onChange]
    );

    const handleOperatorChange = useCallback(
        (value: string | null) => {
            const op = value ?? "";
            onChange(index, {
                ...rule,
                operator: op,
                value: VALUE_HIDDEN_OPERATORS.has(op as Operator) ? null : rule.value
            });
        },
        [rule, index, onChange]
    );

    const handleValueChange = useCallback(
        (value: string | null) => {
            let parsed: string | number | boolean | null = value ?? "";

            // Auto-parse numbers for numeric field types
            if (selectedFieldOption?.fieldType === "number" && parsed !== "") {
                const num = Number(parsed);
                if (!isNaN(num)) {
                    parsed = num;
                }
            }

            // Auto-parse booleans
            if (selectedFieldOption?.fieldType === "boolean") {
                if (parsed === "true") {
                    parsed = true;
                } else if (parsed === "false") {
                    parsed = false;
                }
            }

            onChange(index, { ...rule, value: parsed });
        },
        [rule, index, onChange, selectedFieldOption]
    );

    const handleActionChange = useCallback(
        (value: string | null) => {
            onChange(index, {
                ...rule,
                action: (value ?? actionOptions[0]?.value ?? "hide") as FieldRuleAction
            });
        },
        [rule, index, onChange, actionOptions]
    );

    // For boolean fields, show a dropdown for value
    const isBooleanField = selectedFieldOption?.fieldType === "boolean";

    return (
        <>
            <Separator
                className={index === 0 ? "mb-lg" : "my-lg"}
                variant={"accent"}
                labelPosition={"start"}
            >
                Rule #{index + 1}
            </Separator>
            <Grid>
                <Grid.Column span={4}>
                    <Select
                        displayResetAction={false}
                        label={"Field"}
                        value={rule.target}
                        options={fieldSelectOptions}
                        onChange={handleFieldChange}
                    />
                </Grid.Column>
                <Grid.Column span={4}>
                    <Select
                        displayResetAction={false}
                        label={"Operator"}
                        value={rule.operator}
                        options={operatorSelectOptions}
                        onChange={handleOperatorChange}
                        disabled={!rule.target}
                    />
                </Grid.Column>
                <Grid.Column span={4}>
                    {isBooleanField ? (
                        <Select
                            disabled={!showValue}
                            displayResetAction={false}
                            label={"Value"}
                            value={String(rule.value ?? "")}
                            options={[
                                { value: "true", label: "True" },
                                { value: "false", label: "False" }
                            ]}
                            onChange={handleValueChange}
                        />
                    ) : (
                        <Input
                            disabled={!showValue}
                            label={"Value"}
                            value={rule.value != null ? String(rule.value) : ""}
                            type={selectedFieldOption?.fieldType === "number" ? "number" : "text"}
                            onChange={handleValueChange}
                        />
                    )}
                </Grid.Column>
                <Grid.Column span={12}>
                    <Select
                        displayResetAction={false}
                        value={rule.action}
                        options={actionOptions}
                        onChange={handleActionChange}
                    />
                </Grid.Column>
                <Grid.Column span={12} className={"flex justify-between"}>
                    <Button
                        className={"[&_svg]:fill-destructive text-destructive-primary"}
                        containerClassName={"flex ml-auto"}
                        text={"Remove rule"}
                        icon={<DeleteIcon />}
                        onClick={() => onRemove(index)}
                        variant={"ghost"}
                    />
                </Grid.Column>
            </Grid>
        </>
    );
};

interface RulesTabProps {
    gridClassName?: string;
    fieldOptions: FieldOption[];
    actionOptions?: ActionOption[];
}

export const RulesTab = ({
    gridClassName,
    fieldOptions,
    actionOptions = DEFAULT_ACTION_OPTIONS
}: RulesTabProps) => {
    const bind = useBind({ name: "rules" });
    const allRules: FieldRule[] = bind.value || [];
    const entryRules = allRules.filter(r => r.type === "entryValue");
    const otherRules = allRules.filter(r => r.type !== "entryValue");

    const addRule = () => {
        const newRule: FieldRule = {
            type: "entryValue",
            target: "",
            operator: "",
            value: null,
            action: (actionOptions[0]?.value ?? "hide") as FieldRuleAction
        };
        bind.onChange([...otherRules, ...entryRules, newRule]);
    };

    const updateRule = (index: number, updated: FieldRule) => {
        const next = [...entryRules];
        next[index] = updated;
        bind.onChange([...otherRules, ...next]);
    };

    const removeRule = (index: number) => {
        bind.onChange([...otherRules, ...entryRules.filter((_, i) => i !== index)]);
    };

    return (
        <Grid className={gridClassName}>
            <Grid.Column span={12}>
                {entryRules.map((rule, index) => (
                    <RuleRow
                        key={index}
                        rule={rule}
                        index={index}
                        fieldOptions={fieldOptions}
                        actionOptions={actionOptions}
                        onChange={updateRule}
                        onRemove={removeRule}
                    />
                ))}
                {entryRules.length > 0 ? (
                    <Separator variant={"accent"} className={"mt-lg"} />
                ) : null}
                <div className={"flex justify-center mt-md"}>
                    <Button onClick={addRule} text={"Add Rule"} icon={<AddIcon />} size={"sm"} />
                </div>
            </Grid.Column>
        </Grid>
    );
};
