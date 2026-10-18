import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { DeprecatedRadioGroup } from "@webiny/admin-ui";
import { Radio } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * The automation as radio cards (R274, D14): name and description per definition. A click asks the
 * options to select, the drawer presenter decides between switching at once and confirming (QBZ-14).
 */
export const AutomationCardsRenderer = createFieldRenderer<"workflowAutomationCards">(
    ({ field }) => {
        const { automations } = useStepFormOptions();
        const invalid = field.validation.isValid === false;
        const value = typeof field.value === "string" ? field.value : undefined;

        const label = (
            <FormComponentLabel
                text={field.label}
                required
                disabled={field.disabled}
                invalid={invalid}
            />
        );

        if (automations.failed) {
            return (
                <div className={"w-full"}>
                    {label}
                    <Alert
                        type={"danger"}
                        variant={"subtle"}
                        actions={
                            <Alert.Action
                                text={STEP_FORM_MESSAGES.tryAgain}
                                onClick={automations.retry}
                            />
                        }
                    >
                        {STEP_FORM_MESSAGES.optionsFailed}
                    </Alert>
                </div>
            );
        }

        if (automations.loading) {
            return <div className={"w-full"}>{label}</div>;
        }

        return (
            <div className={"flex w-full flex-col gap-sm"}>
                {label}
                {automations.options.length === 0 && (
                    <Text size={"sm"}>{automations.emptyText}</Text>
                )}
                {automations.options.length > 0 && (
                    <DeprecatedRadioGroup
                        value={value ?? ""}
                        disabled={field.disabled}
                        onValueChange={id => automations.select(id)}
                    >
                        {automations.options.map(option => (
                            <Radio
                                key={option.id}
                                id={`${field.name}-${option.id}`}
                                value={option.id}
                                label={
                                    <span className={"flex flex-col"}>
                                        <span className={"font-semibold"}>{option.name}</span>
                                        {option.description && (
                                            <span className={"text-sm"}>{option.description}</span>
                                        )}
                                    </span>
                                }
                            />
                        ))}
                    </DeprecatedRadioGroup>
                )}
                <FormComponentErrorMessage
                    text={field.validation.message}
                    invalid={invalid}
                    disabled={field.disabled}
                />
                {automations.warning && (
                    <Alert type={"warning"} variant={"subtle"}>
                        {automations.warning}
                    </Alert>
                )}
                {automations.settingsWarning && (
                    <Alert type={"warning"} variant={"subtle"}>
                        {automations.settingsWarning}
                    </Alert>
                )}
            </div>
        );
    }
);
