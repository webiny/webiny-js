import React from "react";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { TemplateIcon } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateIcon.js";
import { Text, Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { ReactComponent as PlusIcon } from "@webiny/icons/add.svg";

export interface TemplateListItemProps {
    template: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

// Used #f1f2f4 b/c in Figma, the color was result of multiple colors combined.
export const TemplateListItem = ({ template, onTemplate }: TemplateListItemProps) => {
    return (
        <Dialog.Close asChild>
            <div
                onClick={() => onTemplate(template)}
                className={
                    "group flex items-center gap-y-md py-sm-extra px-md rounded-lg bg-neutral-light hover:bg-neutral-dimmed cursor-pointer"
                }
            >
                <div className={"flex items-center justify-center shrink-0 pr-md"}>
                    <TemplateIcon icon={template.icon} style={{ width: 24, height: 24 }} />
                </div>
                <div className={"flex-1 min-w-0"}>
                    <Text size={"md"} className={"text-neutral-primary font-semibold truncate"}>
                        {template.name}
                    </Text>
                    {template.description && (
                        <Text size={"sm"} as={"div"} className={"text-neutral-muted truncate"}>
                            {template.description}
                        </Text>
                    )}
                </div>
                <div className={"hidden group-hover:block"}>
                    <Button size={"md"} variant={"primary"} icon={<PlusIcon />}>
                        Insert
                    </Button>
                </div>
            </div>
        </Dialog.Close>
    );
};
