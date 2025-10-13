import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { TemplateIcon } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateIcon.js";
import { Button, Heading, Text } from "@webiny/admin-ui";

export interface TemplateCardProps {
    template: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

export const TemplateItem = makeDecoratable(
    "TemplateItem",
    ({ template, onTemplate }: TemplateCardProps) => {
        return (
            <div
                className={
                    "flex flex-col justify-between bg-neutral-base rounded-sm shadow-sm overflow-hidden"
                }
            >
                <div>
                    <div className={"text-center p-lg bg-neutral-muted"}>
                        <TemplateIcon icon={template.icon} />
                    </div>
                    <div className={"pt-md px-md text-left"}>
                        <Heading level={6} className={"mb-xs"}>
                            {template.name}
                        </Heading>
                        <Text size={"sm"} as={"div"} className={"text-neutral-strong"}>
                            {template.description}
                        </Text>
                    </div>
                </div>
                <div className={"p-sm text-right"}>
                    <Button size={"sm"} text={"Insert"} onClick={() => onTemplate(template)} />
                </div>
            </div>
        );
    }
);
