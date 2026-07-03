import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, Tooltip, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as PasteIcon } from "@webiny/icons/content_paste.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as HorizontalRuleIcon } from "@webiny/icons/horizontal_rule.svg";
import type { IObjectFieldVM } from "~/features/formModel/index.js";
import { TEMPLATE_DISCRIMINATOR } from "~/features/formModel/ObjectField.js";
import { ClipboardFeature } from "~/features/clipboard/feature.js";
import { useConfirmationDialog } from "~/hooks/useConfirmationDialog.js";
import { NestedLayout } from "./ObjectFieldComponents.js";
import { AddTemplateButton } from "./TemplatePicker.js";

interface SingleValueDynamicZoneProps {
    field: IObjectFieldVM;
    showContainer?: boolean;
}

export const SingleValueDynamicZone = observer(
    ({ field, showContainer = true }: SingleValueDynamicZoneProps) => {
        const toast = useToast();
        const { clipboard } = useFeature(ClipboardFeature);
        const activeTemplate =
            field.activeTemplateId !== null
                ? field.availableTemplates.find(t => t.id === field.activeTemplateId)
                : undefined;

        const { showConfirmation } = useConfirmationDialog({
            title: "Remove template",
            message: "Are you sure you want to remove this item? This action is not reversible.",
            acceptLabel: "Yes, I'm sure!",
            cancelLabel: "No, leave it."
        });

        const onClear = () => {
            showConfirmation(() => {
                field.onChange(null);
            });
        };

        const clipboardItem = clipboard.item;
        const canPaste =
            clipboardItem !== null &&
            clipboardItem.type === "wby.dz" &&
            typeof clipboardItem.data[TEMPLATE_DISCRIMINATOR] === "string" &&
            field.availableTemplates.some(t => t.id === clipboardItem.data[TEMPLATE_DISCRIMINATOR]);

        const content = (
            <>
                {activeTemplate ? (
                    <Accordion background={"base"} variant={"container"}>
                        <Accordion.Item
                            title={activeTemplate.label}
                            actions={
                                field.disabled ? null : (
                                    <>
                                        <Accordion.Item.Action
                                            icon={
                                                <Tooltip
                                                    trigger={<CopyIcon />}
                                                    content={"Copy to clipboard"}
                                                />
                                            }
                                            onClick={() => {
                                                clipboard.copy({
                                                    type: "wby.dz",
                                                    data: field.getClonedData()
                                                });
                                                toast.showSuccessToast({
                                                    title: "Copied to clipboard."
                                                });
                                            }}
                                        />
                                        <Accordion.Item.Action
                                            icon={
                                                <Tooltip
                                                    trigger={<DeleteIcon />}
                                                    content={"Delete"}
                                                />
                                            }
                                            onClick={onClear}
                                        />
                                    </>
                                )
                            }
                        >
                            <NestedLayout layout={field.layout} />
                        </Accordion.Item>
                    </Accordion>
                ) : null}
                {!activeTemplate && !field.disabled && (
                    <div className={"flex gap-sm items-center"}>
                        <AddTemplateButton
                            templates={field.availableTemplates}
                            onSelect={template => field.setTemplate(template.id)}
                        />
                        {canPaste && (
                            <Button
                                size={"sm"}
                                variant={"tertiary"}
                                text={"Paste"}
                                icon={<PasteIcon />}
                                onClick={() => {
                                    const pasted = clipboard.paste();
                                    if (pasted) {
                                        field.onChange(pasted.data);
                                        toast.showSuccessToast({
                                            title: "Pasted from clipboard."
                                        });
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </>
        );

        if (!showContainer) {
            return <div className={"flex flex-col gap-lg"}>{content}</div>;
        }

        return (
            <Accordion background={"base"} variant={"container"}>
                <Accordion.Item
                    icon={
                        <Accordion.Item.Icon
                            color={"accent"}
                            label={"Dynamic Zone"}
                            icon={<HorizontalRuleIcon />}
                        />
                    }
                    title={field.label}
                    defaultOpen={true}
                >
                    {content}
                </Accordion.Item>
            </Accordion>
        );
    }
);
