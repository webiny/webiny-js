import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import { WRAPPING_LABEL_CLASS_NAME } from "./wrappingLabelClassName.js";
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

        const labelId = `${field.name}-label`;
        const label = (
            <FormComponentLabel
                id={labelId}
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
                    <RadioGroup
                        aria-labelledby={labelId}
                        value={value ?? ""}
                        disabled={field.disabled}
                        items={automations.options.map(option => ({
                            id: `${field.name}-${option.id}`,
                            value: option.id,
                            label: (
                                <span className={cn("flex flex-col", WRAPPING_LABEL_CLASS_NAME)}>
                                    <span className={"font-semibold break-words"}>
                                        {option.name}
                                    </span>
                                    {option.description && (
                                        <span className={"text-sm break-words"}>
                                            {option.description}
                                        </span>
                                    )}
                                </span>
                            )
                        }))}
                        onChange={id => automations.select(id)}
                    />
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
