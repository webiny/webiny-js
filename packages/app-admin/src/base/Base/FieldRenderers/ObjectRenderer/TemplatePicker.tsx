import React, { useState } from "react";
import { Button, Dialog, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as PlusIcon } from "@webiny/icons/add_circle_outline.svg";
import type { ITemplateVM } from "~/features/formModel/index.js";

export interface AddTemplateButtonProps {
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
    label?: string;
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "secondary" | "tertiary";
}

export const AddTemplateButton = ({
    templates,
    onSelect,
    label = "Add a template",
    size = "sm",
    variant = "tertiary"
}: AddTemplateButtonProps) => {
    return (
        <div className={"flex justify-between items-center"}>
            <Dialog
                size={"lg"}
                className={"w-[800px]"}
                trigger={
                    <Button size={size} variant={variant} text={label} icon={<AddIcon />} />
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
