import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as HorizontalRuleIcon } from "@webiny/icons/horizontal_rule.svg";
import type { IObjectFieldVM } from "~/features/formModel/index.js";
import { useConfirmationDialog } from "~/hooks/useConfirmationDialog.js";
import { NestedLayout } from "./ObjectFieldComponents.js";
import { AddTemplateButton } from "./TemplatePicker.js";

interface SingleValueDynamicZoneProps {
    field: IObjectFieldVM;
    showContainer?: boolean;
}

export const SingleValueDynamicZone = observer(
    ({ field, showContainer = true }: SingleValueDynamicZoneProps) => {
        const activeTemplate =
            field.activeTemplateId !== null
                ? field.availableTemplates.find(t => t.id === field.activeTemplateId)
                : undefined;

        const { showConfirmation } = useConfirmationDialog({
            title: "Remove template",
            message:
                "Are you sure you want to remove this item? This action is not reversible.",
            acceptLabel: "Yes, I'm sure!",
            cancelLabel: "No, leave it."
        });

        const onClear = () => {
            showConfirmation(() => {
                field.onChange(null);
            });
        };

        const content = (
            <>
                {activeTemplate ? (
                    <Accordion background={"base"} variant={"container"}>
                        <Accordion.Item
                            title={activeTemplate.name}
                            actions={
                                field.disabled ? null : (
                                    <Accordion.Item.Action
                                        icon={
                                            <Tooltip trigger={<DeleteIcon />} content={"Delete"} />
                                        }
                                        onClick={onClear}
                                    />
                                )
                            }
                        >
                            <NestedLayout layout={field.layout} />
                        </Accordion.Item>
                    </Accordion>
                ) : null}
                {!activeTemplate && !field.disabled && (
                    <AddTemplateButton
                        templates={field.availableTemplates}
                        onSelect={template => field.setTemplate(template.id)}
                    />
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
