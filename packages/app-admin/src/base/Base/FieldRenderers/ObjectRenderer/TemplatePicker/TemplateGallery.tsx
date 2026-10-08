import React, { useState } from "react";
import type { ITemplateVM } from "~/features/formModel/index.js";
import { TemplateGalleryToolbar } from "./TemplateGalleryToolbar.js";
import { TemplateList } from "./TemplateList.js";
import type { ViewMode } from "./types.js";

interface TemplateGalleryProps {
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
}

export const TemplateGallery = ({ templates, onSelect }: TemplateGalleryProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [search, setSearch] = useState("");

    const query = search.toLowerCase();
    const filteredTemplates = templates.filter(template =>
        template.label.toLowerCase().includes(query)
    );

    return (
        <>
            <TemplateGalleryToolbar
                search={search}
                onSearch={setSearch}
                viewMode={viewMode}
                onViewMode={setViewMode}
            />
            <TemplateList viewMode={viewMode} templates={filteredTemplates} onSelect={onSelect} />
        </>
    );
};
