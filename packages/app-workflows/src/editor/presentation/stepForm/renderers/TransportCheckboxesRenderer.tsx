import React from "react";
import { Alert } from "@webiny/admin-ui";
import { CheckboxGroup } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import { WRAPPING_LABEL_CLASS_NAME } from "./wrappingLabelClassName.js";
import "../stepFormRendererNames.js";

// Notify via always follows another field of the General tab, so it opens with the section divider.
const SECTION_CLASS_NAME = "w-full flex flex-col gap-md";

/*
 * Notify via (R272, D129, D151): one checkbox per listed transport. Ids on the step that are not
 * listed are kept on every change and never shown.
 */
export const TransportCheckboxesRenderer = createFieldRenderer<"workflowTransports">(
    ({ field }) => {
        const { transports } = useStepFormOptions();
        const stored: string[] = Array.isArray(field.value) ? field.value : [];
        const knownIds = transports.options.map(option => option.id);
        const known = new Set(knownIds);
        const kept = stored.filter(id => !known.has(id));
        const ticked = stored.filter(id => known.has(id));

        const heading = (
            <>
                <FormComponentLabel text={field.label} disabled={field.disabled} />
                <FormComponentDescription text={field.description} disabled={field.disabled} />
            </>
        );

        if (transports.failed) {
            return (
                <div className={SECTION_CLASS_NAME}>
                    <Separator />
                    {heading}
                    <Alert
                        type={"danger"}
                        variant={"subtle"}
                        actions={
                            <Alert.Action
                                text={STEP_FORM_MESSAGES.tryAgain}
                                onClick={transports.retry}
                            />
                        }
                    >
                        {STEP_FORM_MESSAGES.optionsFailed}
                    </Alert>
                </div>
            );
        }

        if (transports.loading) {
            return (
                <div className={SECTION_CLASS_NAME}>
                    <Separator />
                    {heading}
                </div>
            );
        }

        if (transports.options.length === 0) {
            return (
                <div className={SECTION_CLASS_NAME}>
                    <Separator />
                    {heading}
                    <Text size={"sm"}>{STEP_FORM_MESSAGES.noTransports}</Text>
                </div>
            );
        }

        const items = transports.options.map(option => {
            const label = (
                <span className={cn(WRAPPING_LABEL_CLASS_NAME, "break-words")}>
                    {option.title}
                    {option.description && (
                        <>
                            {" "}
                            <FormComponentNote
                                className={"mt-0 inline"}
                                text={`· ${option.description}`}
                            />
                        </>
                    )}
                </span>
            );
            return { label, value: option.id };
        });

        return (
            <div className={SECTION_CLASS_NAME}>
                <Separator />
                <CheckboxGroup
                    label={field.label}
                    note={field.description}
                    disabled={field.disabled}
                    validation={field.validation}
                    items={items}
                    value={ticked}
                    onChange={values => {
                        field.onChange([...kept, ...values]);
                        field.onBlur();
                    }}
                />
            </div>
        );
    }
);
