import React, { useState } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { TemplateIcon } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateIcon.js";
import { Text, Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";

export interface TemplateCardProps {
    template: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

export const TemplateItem = makeDecoratable(
    "TemplateItem",
    ({ template, onTemplate }: TemplateCardProps) => {
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
                        className={
                            "flex items-center justify-center py-xxl w-full bg-neutral-dimmed"
                        }
                    >
                        <TemplateIcon icon={template.icon} style={{ width: 40, height: 40 }} />
                    </div>
                    <div className={"py-sm-extra px-md"}>
                        <Text size={"md"} className={"mb-xs text-neutral-primary font-semibold"}>
                            {template.name}
                        </Text>
                        <Text size={"sm"} as={"div"} className={"text-neutral-muted"}>
                            {template.description}
                        </Text>
                    </div>
                </div>

                {isHovered && (
                    <Dialog.Close asChild>
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-white/80 cursor-pointer"
                            onClick={() => onTemplate(template)}
                        >
                            <Button variant="primary">Insert</Button>
                        </div>
                    </Dialog.Close>
                )}
            </div>
        );
    }
);
