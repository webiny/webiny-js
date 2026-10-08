import React from "react";
import type { ITemplateVM } from "~/features/formModel/index.js";
import { TemplateCard } from "./TemplateCard.js";
import { TemplateListItem } from "./TemplateListItem.js";
import type { ViewMode } from "./types.js";

interface TemplateListProps {
    viewMode: ViewMode;
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
}

export const TemplateList = ({ viewMode, templates, onSelect }: TemplateListProps) => {
    if (viewMode === "list") {
        return (
            <div className={"flex flex-col gap-y-sm mb-xs"}>
                {templates.map(template => (
                    <TemplateListItem key={template.id} template={template} onSelect={onSelect} />
                ))}
            </div>
        );
    }

    return (
        <div className={"gap-md flex flex-wrap p-xs mb-xs"}>
            {templates.map(template => (
                <TemplateCard key={template.id} template={template} onSelect={onSelect} />
            ))}
        </div>
    );
};
