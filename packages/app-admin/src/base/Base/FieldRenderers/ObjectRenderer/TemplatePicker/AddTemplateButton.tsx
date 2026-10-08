import React from "react";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { ITemplateVM } from "~/features/formModel/index.js";
import { TemplateGallery } from "./TemplateGallery.js";

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
    label,
    size = "sm",
    variant = "tertiary"
}: AddTemplateButtonProps) => {
    return (
        <div className={"flex justify-between items-center"}>
            <Dialog
                size={"lg"}
                className={"w-[800px]"}
                trigger={<Button size={size} variant={variant} text={label} icon={<AddIcon />} />}
                title={"Insert a template"}
                info={<></>}
            >
                <TemplateGallery templates={templates} onSelect={onSelect} />
            </Dialog>
        </div>
    );
};
