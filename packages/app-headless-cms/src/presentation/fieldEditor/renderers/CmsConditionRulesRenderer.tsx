import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IObjectFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { Grid, Select, Input, Button, Separator } from "@webiny/admin-ui";
import type { FieldRule, FieldRuleAction } from "~/types.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";
import {
    getOperatorOptions,
    VALUE_HIDDEN_OPERATORS
} from "@webiny/app-headless-cms-common/Fields/operatorOptions.js";
import type { Operator } from "@webiny/app-headless-cms-common/Fields/evaluateExpression.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";

const DEFAULT_ACTION_OPTIONS = [
    { value: "hide", label: "Hide" },
    { value: "disable", label: "Disable" }
];

export const CmsConditionRulesRenderer = createObjectFieldRenderer(({ field }) => {
    return <ConditionRules field={field} />;
});

interface ConditionRulesProps {
    field: IObjectFieldVM;
}

const ConditionRules = observer(({ field }: ConditionRulesProps) => {
    const { fieldOptions } = useModelEditor();
    const rules: FieldRule[] = Array.isArray(field.value) ? (field.value as FieldRule[]) : [];

    const addRule = useCallback(() => {
        const newRule: FieldRule = {
            type: "condition",
            target: "",
            operator: "",
            value: null,
            action: "hide"
        };
        field.onChange([...rules, newRule]);
    }, [rules, field]);

    const updateRule = useCallback(
        (index: number, updated: FieldRule) => {
            const next = [...rules];
            next[index] = updated;
            field.onChange(next);
        },
        [rules, field]
    );

    const removeRule = useCallback(
        (index: number) => {
            field.onChange(rules.filter((_, i) => i !== index));
        },
        [rules, field]
    );

    return (
        <Grid>
            <Grid.Column span={12}>
                {rules.map((rule, index) => (
                    <RuleRow
                        key={index}
                        rule={rule}
                        index={index}
                        fieldOptions={fieldOptions}
                        actionOptions={DEFAULT_ACTION_OPTIONS}
                        onChange={updateRule}
                        onRemove={removeRule}
                    />
                ))}
                {rules.length > 0 ? <Separator variant={"accent"} className={"mt-lg"} /> : null}
                <div className={"flex justify-center mt-md"}>
                    <Button onClick={addRule} text={"Add Rule"} icon={<AddIcon />} size={"sm"} />
                </div>
            </Grid.Column>
        </Grid>
    );
});

interface RuleRowProps {
    rule: FieldRule;
    index: number;
    fieldOptions: FieldOption[];
    actionOptions: Array<{ value: string; label: string }>;
    onChange: (index: number, updated: FieldRule) => void;
    onRemove: (index: number) => void;
}

const RuleRow = observer(
    ({ rule, index, fieldOptions, actionOptions, onChange, onRemove }: RuleRowProps) => {
        const selectedFieldOption = useMemo(
            () => fieldOptions.find(o => o.value === rule.target),
            [fieldOptions, rule.target]
        );

        const operatorOptions = useMemo(
            () => (selectedFieldOption ? getOperatorOptions(selectedFieldOption.fieldType) : []),
            [selectedFieldOption]
        );

        const showValue =
            rule.operator && !VALUE_HIDDEN_OPERATORS.has(rule.operator as Operator);
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
                    <Grid.Column span={12}>
                        <Select
                            displayResetAction={false}
                            label={"Field"}
                            value={rule.target}
                            options={fieldOptions.map(o => ({ value: o.value, label: o.label }))}
                            onChange={value => {
                                const newTarget = value ?? "";
                                const newFieldOption = fieldOptions.find(
                                    o => o.value === newTarget
                                );
                                const newOps = newFieldOption
                                    ? getOperatorOptions(newFieldOption.fieldType)
                                    : [];
                                const currentOpValid = newOps.some(
                                    o => o.value === rule.operator
                                );
                                onChange(index, {
                                    ...rule,
                                    target: newTarget,
                                    operator: currentOpValid ? rule.operator : "",
                                    value: currentOpValid ? rule.value : null
                                });
                            }}
                        />
                    </Grid.Column>
                    <Grid.Column span={6}>
                        <Select
                            displayResetAction={false}
                            label={"Operator"}
                            value={rule.operator}
                            options={operatorOptions.map(o => ({
                                value: o.value,
                                label: o.label
                            }))}
                            onChange={value => {
                                const op = value ?? "";
                                onChange(index, {
                                    ...rule,
                                    operator: op,
                                    value: VALUE_HIDDEN_OPERATORS.has(op as Operator)
                                        ? null
                                        : rule.value
                                });
                            }}
                            disabled={!rule.target}
                        />
                    </Grid.Column>
                    <Grid.Column span={6}>
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
                                onChange={value => {
                                    let parsed: string | number | boolean | null = value ?? "";
                                    if (parsed === "true") {
                                        parsed = true;
                                    } else if (parsed === "false") {
                                        parsed = false;
                                    }
                                    onChange(index, { ...rule, value: parsed });
                                }}
                            />
                        ) : (
                            <Input
                                disabled={!showValue}
                                label={"Value"}
                                value={rule.value != null ? String(rule.value) : ""}
                                type={
                                    selectedFieldOption?.fieldType === "number" ? "number" : "text"
                                }
                                onChange={value => {
                                    let parsed: string | number | boolean | null = value ?? "";
                                    if (
                                        selectedFieldOption?.fieldType === "number" &&
                                        parsed !== ""
                                    ) {
                                        const num = Number(parsed);
                                        if (!isNaN(num)) {
                                            parsed = num;
                                        }
                                    }
                                    onChange(index, { ...rule, value: parsed });
                                }}
                            />
                        )}
                    </Grid.Column>
                    <Grid.Column span={12}>
                        <Select
                            label={"Action"}
                            displayResetAction={false}
                            value={rule.action}
                            options={actionOptions}
                            onChange={value => {
                                onChange(index, {
                                    ...rule,
                                    action: (value ??
                                        actionOptions[0]?.value ??
                                        "hide") as FieldRuleAction
                                });
                            }}
                        />
                    </Grid.Column>
                    <Grid.Column span={12} className={"flex justify-between"}>
                        <Button
                            className={
                                "[&_svg]:fill-destructive text-destructive-primary"
                            }
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
    }
);
