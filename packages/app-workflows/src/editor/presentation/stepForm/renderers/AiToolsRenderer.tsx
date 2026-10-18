import React from "react";
import { Alert } from "@webiny/admin-ui";
import { CheckboxPrimitiveRenderer } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { AI_FORM_MESSAGES } from "../aiFormMessages.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Tools (R275, R283): one checkbox per tool of `listAiTools`, tagged `Changes content` when the tool
 * can edit the revision, with the design's hint under the list. Names stored on the step that the
 * list does not offer are kept on every change and never shown (like transports). A server error
 * on `config.tools` shows under the list through the field's validation. The rows use the
 * presenter-less `CheckboxPrimitiveRenderer`: the admin-ui `Checkbox` and `CheckboxGroup`
 * deep-observe a JSX label and overflow the stack.
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

    if (aiTools.options.length === 0) {
        return null;
    }

    const invalid = field.validation.isValid === false;

    const labelId = `${field.name}-label`;
    const hintId = `${field.name}-hint`;

    const onToggle = (name: string, checked: boolean) => {
        const next = ticked.filter(item => item !== name);
        if (checked) {
            next.push(name);
        }
        field.onChange([...kept, ...next]);
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
            {aiTools.options.map(option => {
                return (
                    <CheckboxPrimitiveRenderer
                        key={option.name}
                        id={`ai-tool-${option.name}`}
                        value={option.name}
                        hasLabel={true}
                        indeterminate={false}
                        disabled={field.disabled}
                        checked={ticked.includes(option.name)}
                        changeChecked={checked => onToggle(option.name, checked)}
                        label={
                            <span className={"flex flex-col gap-xs"}>
                                <span className={"flex items-center gap-sm"}>
                                    <span>{option.title}</span>
                                    {option.changesContent && (
                                        <Tag
                                            variant={"neutral-light"}
                                            content={AI_FORM_MESSAGES.changesContentTag}
                                            icon={<EditNoteIcon />}
                                        />
                                    )}
                                </span>
                                <span className={"text-sm"}>{option.description}</span>
                            </span>
                        }
                    />
                );
            })}
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
