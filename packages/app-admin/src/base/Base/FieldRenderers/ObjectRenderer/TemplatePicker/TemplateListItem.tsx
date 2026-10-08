import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PlusIcon } from "@webiny/icons/add_circle_outline.svg";
import { SelectableTemplate } from "./SelectableTemplate.js";
import { TemplateIcon } from "./TemplateIcon.js";
import type { TemplateItemProps } from "./types.js";

// Used #f1f2f4 b/c in Figma, the color was result of multiple colors combined.
export const TemplateListItem = ({ template, onSelect }: TemplateItemProps) => {
    return (
        <SelectableTemplate
            template={template}
            onSelect={onSelect}
            className={
                "flex items-center py-sm-extra px-md rounded-lg bg-neutral-light hover:bg-[#f1f2f4]"
            }
        >
            <div className={"flex items-center justify-center shrink-0 pr-md"}>
                <TemplateIcon icon={template.icon} size={24} />
            </div>
            <div className={"flex-1 min-w-0"}>
                <Text size={"md"} className={"text-neutral-primary font-semibold truncate"}>
                    {template.label}
                </Text>
                {template.description && (
                    <Text size={"sm"} as={"div"} className={"text-neutral-muted truncate"}>
                        {template.description}
                    </Text>
                )}
            </div>
            <div className={"hidden group-hover:block group-focus-visible:block"}>
                <Button
                    size={"md"}
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
