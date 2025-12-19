import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { TemplateIcon } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateIcon.js";
import { Text } from "@webiny/admin-ui";

export interface TemplateCardProps {
    template: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

export const TemplateItem = makeDecoratable(
    "TemplateItem",
    ({ template, onTemplate }: TemplateCardProps) => {
        return (
            // <DialogClose asChild>
            <div
                onClick={() => onTemplate(template)}
                className={
                    "flex flex-col justify-between bg-neutral-base shadow-sm overflow-hidden rounded-lg w-[173px] border-neutral-dimmed-darker border-sm"
                }
            >
                <div>
                    <div
                        className={
                            "flex items-center justify-center h-[117px] w-full bg-neutral-dimmed"
                        }
                    >
                        <TemplateIcon icon={template.icon} />
                    </div>
                    <div className={"py-sm-extra px-md"}>
                        <Text size={"md"} className={"mb-xs text-neutral-primary"}>
                            {template.name}
                        </Text>
                        <Text size={"sm"} as={"div"} className={"text-neutral-muted"}>
                            {template.description}
                        </Text>
                    </div>
                </div>
            </div>
        );
    }
);
