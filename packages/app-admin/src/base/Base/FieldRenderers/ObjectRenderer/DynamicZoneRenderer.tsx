import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, Dialog, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as PlusIcon } from "@webiny/icons/add_circle_outline.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as HorizontalRuleIcon } from "@webiny/icons/horizontal_rule.svg";
import type { IObjectFieldVM, ITemplateVM } from "~/features/formModel/index.js";
import { useConfirmationDialog } from "~/hooks/useConfirmationDialog.js";
import { ChildFields } from "./ObjectFieldComponents.js";

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

interface AddTemplateButtonProps {
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
}

const AddTemplateButton = ({ templates, onSelect }: AddTemplateButtonProps) => {
    return (
        <div className={"flex justify-between items-center"}>
            <Dialog
                size={"lg"}
                className={"w-[800px]"}
                trigger={
                    <Button
                        size={"sm"}
                        variant={"tertiary"}
                        text={"Add a template"}
                        icon={<AddIcon />}
                    />
                }
                title={"Insert a template"}
                info={<></>}
            >
                <TemplateGallery templates={templates} onSelect={onSelect} />
            </Dialog>
        </div>
    );
};

interface TemplateGalleryProps {
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
}

const TemplateGallery = ({ templates, onSelect }: TemplateGalleryProps) => {
    return (
        <div className={"gap-md flex flex-wrap"}>
            {templates.map(template => (
                <TemplateCard key={template.id} template={template} onSelect={onSelect} />
            ))}
        </div>
    );
};

interface TemplateCardProps {
    template: ITemplateVM;
    onSelect: (template: ITemplateVM) => void;
}

const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={
                "flex flex-col justify-between bg-neutral-base overflow-hidden rounded-lg w-[173px] relative shadow-sm"
            }
        >
            <div>
                <div
                    className={"flex items-center justify-center py-xxl w-full bg-neutral-dimmed"}
                />
                <div className={"py-sm-extra px-md"}>
                    <Text size={"md"} className={"mb-xs text-neutral-primary font-semibold"}>
                        {template.name}
                    </Text>
                </div>
            </div>

            {isHovered && (
                <Dialog.Close asChild>
                    <div
                        className={
                            "absolute inset-0 flex items-center justify-center bg-white/80 cursor-pointer"
                        }
                        onClick={() => onSelect(template)}
                    >
                        <Button size={"lg"} variant={"primary"} icon={<PlusIcon />}>
                            Insert
                        </Button>
                    </div>
                </Dialog.Close>
            )}
        </div>
    );
};
