import React from "react";
import { Alert } from "@webiny/admin-ui";
import { CheckboxGroup } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { AI_FORM_MESSAGES } from "../aiFormMessages.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import { WRAPPING_LABEL_CLASS_NAME } from "./wrappingLabelClassName.js";
import "../stepFormRendererNames.js";

/*
 * Tools (R275, R283): one checkbox per tool of `listAiTools`, tagged `Changes content` when the tool
 * can edit the revision, with the design's hint under the list. Names stored on the step that the
 * list does not offer are kept on every change and never shown (like transports). A server error
 * on `config.tools` shows under the list through the field's validation. The rows use the stock
 * `CheckboxGroup`.
 */
export const AiToolsRenderer = createFieldRenderer<"workflowAiTools">(({ field }) => {
    const { aiTools } = useStepFormOptions();
    const stored: string[] = Array.isArray(field.value) ? field.value : [];
    const known = new Set(aiTools.options.map(option => option.name));
    const kept = stored.filter(name => !known.has(name));
    const ticked = stored.filter(name => known.has(name));

    if (aiTools.failed) {
        return (
            <div className={"w-full"}>
                <FormComponentLabel text={field.label} disabled={field.disabled} />
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={aiTools.retry} />
                    }
                >
                    {STEP_FORM_MESSAGES.optionsFailed}
                </Alert>
            </div>
        );
    }

    if (aiTools.loading) {
        return (
            <div className={"w-full"}>
                <FormComponentLabel text={field.label} disabled={field.disabled} />
            </div>
        );
    }

    const invalid = field.validation.isValid === false;

    // No tools to offer: nothing to show, unless the server refused the stored tools, which must
    // stay visible (a stored tool that is no longer registered).
    if (aiTools.options.length === 0) {
        if (!invalid) {
            return null;
        }
        return (
            <div className={"flex w-full flex-col gap-sm"}>
                <FormComponentLabel text={field.label} disabled={field.disabled} invalid />
                <FormComponentErrorMessage
                    text={field.validation.message}
                    invalid
                    disabled={field.disabled}
                />
            </div>
        );
    }

    const labelId = `${field.name}-label`;
    const hintId = `${field.name}-hint`;

    const onChange = (values: string[]) => {
        field.onChange([...kept, ...values]);
        field.onBlur();
    };

    return (
        <div
            className={"flex w-full flex-col gap-sm"}
            role={"group"}
            aria-labelledby={labelId}
            aria-describedby={hintId}
        >
            <FormComponentLabel
                id={labelId}
                text={field.label}
                disabled={field.disabled}
                invalid={invalid}
            />
            <CheckboxGroup
                disabled={field.disabled}
                value={ticked}
                onChange={onChange}
                items={aiTools.options.map(option => ({
                    id: `ai-tool-${option.name}`,
                    value: option.name,
                    label: (
                        <span className={cn("flex flex-col gap-xs", WRAPPING_LABEL_CLASS_NAME)}>
                            <span
                                className={cn(
                                    "flex items-center gap-sm",
                                    WRAPPING_LABEL_CLASS_NAME
                                )}
                            >
                                <span>{option.label}</span>
                                {option.changesContent && (
                                    <Tag
                                        variant={"neutral-light"}
                                        content={AI_FORM_MESSAGES.changesContentTag}
                                        icon={<EditNoteIcon />}
                                    />
                                )}
                            </span>
                            <Text size={"sm"} className={WRAPPING_LABEL_CLASS_NAME}>
                                {option.summary}
                            </Text>
                        </span>
                    )
                }))}
            />
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
            <FormComponentDescription
                id={hintId}
                text={AI_FORM_MESSAGES.toolsHint}
                disabled={field.disabled}
            />
        </div>
    );
});
