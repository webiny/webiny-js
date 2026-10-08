import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PlusIcon } from "@webiny/icons/add_circle_outline.svg";
import { SelectableTemplate } from "./SelectableTemplate.js";
import { TemplateIcon } from "./TemplateIcon.js";
import type { TemplateItemProps } from "./types.js";

export const TemplateCard = ({ template, onSelect }: TemplateItemProps) => {
    return (
        <SelectableTemplate
            template={template}
            onSelect={onSelect}
            className={
                "flex flex-col justify-between bg-neutral-base overflow-hidden rounded-lg w-[173px] relative shadow-sm"
            }
        >
            <div>
                <div className={"flex items-center justify-center py-xxl w-full bg-neutral-dimmed"}>
                    <TemplateIcon icon={template.icon} size={40} />
                </div>
                <div className={"py-sm-extra px-md"}>
                    <Text size={"md"} className={"mb-xs text-neutral-primary font-semibold"}>
                        {template.label}
                    </Text>
                    {template.description && (
                        <Text size={"sm"} as={"div"} className={"text-neutral-muted"}>
                            {template.description}
                        </Text>
                    )}
                </div>
            </div>

            <div
                className={
                    "absolute inset-0 hidden items-center justify-center bg-white/80 group-hover:flex group-focus-visible:flex"
                }
            >
                <Button
                    size={"lg"}
                    variant={"primary"}
                    icon={<PlusIcon />}
                    tabIndex={-1}
                    aria-hidden={true}
                >
                    Insert
                </Button>
            </div>
        </SelectableTemplate>
    );
};
