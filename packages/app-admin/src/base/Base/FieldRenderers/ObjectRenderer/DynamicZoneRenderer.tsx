import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as HorizontalRuleIcon } from "@webiny/icons/horizontal_rule.svg";
import type { IObjectFieldVM } from "~/features/formModel/index.js";
import { useConfirmationDialog } from "~/hooks/useConfirmationDialog.js";
import { ChildFields } from "./ObjectFieldComponents.js";
import { AddTemplateButton } from "./TemplatePicker.js";

export const DynamicZoneRenderer = observer(({ field }: { field: IObjectFieldVM }) => {
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

    return (
        <div className={"flex flex-col gap-md"}>
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
                    {activeTemplate ? (
                        <Accordion background={"base"} variant={"container"}>
                            <Accordion.Item
                                title={activeTemplate.name}
                                actions={
                                    field.disabled ? null : (
                                        <Accordion.Item.Action
                                            icon={
                                                <Tooltip
                                                    trigger={<DeleteIcon />}
                                                    content={"Delete"}
                                                />
                                            }
                                            onClick={onClear}
                                        />
                                    )
                                }
                            >
                                <ChildFields fields={field.fields} />
                            </Accordion.Item>
                        </Accordion>
                    ) : null}
                </Accordion.Item>
            </Accordion>
            {!activeTemplate && !field.disabled && (
                <AddTemplateButton
                    templates={field.availableTemplates}
                    onSelect={template => field.setTemplate(template.id)}
                />
            )}
        </div>
    );
});
