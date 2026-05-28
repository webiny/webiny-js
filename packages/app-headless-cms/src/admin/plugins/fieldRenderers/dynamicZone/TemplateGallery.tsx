import React, { useState } from "react";
import type { DecoratableComponent } from "@webiny/app-admin";
import { makeDecoratable, withDecoratorFactory } from "@webiny/app-admin";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { useModel, useModelField } from "~/admin/hooks/index.js";
import { TemplateGridItem } from "./TemplateGridItem.js";
import { TemplateListItem } from "./TemplateListItem.js";
import { Input, Icon, DelayedOnChange, ToggleGroup } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";

export interface TemplateGalleryContainerProps {
    children: React.ReactNode;
}

const GalleryContainer = makeDecoratable(
    "TemplateGalleryContainer",
    (props: TemplateGalleryContainerProps) => {
        return <>{props.children}</>;
    }
);

export interface TemplateGalleryListProps {
    children: React.ReactNode;
}

const GalleryList = makeDecoratable("TemplateGalleryList", (props: TemplateGalleryListProps) => {
    return <div className={"gap-md flex flex-wrap mb-xs"}>{props.children}</div>;
});

export interface TemplateGalleryProps {
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
    onClose: () => void;
    templates?: CmsDynamicZoneTemplate[];
}

const Gallery = makeDecoratable("TemplateGallery", (props: TemplateGalleryProps) => {
    const { field } = useModelField();
    const templates = props.templates || field.settings?.templates || [];

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <GalleryContainer>
            <div className={"flex items-center gap-sm pb-md pt-xs"}>
                <div className={"flex-1 min-w-0"}>
                    <DelayedOnChange value={search} onChange={setSearch}>
                        {({ value, onChange }) => (
                            <Input
                                autoFocus={true}
                                value={value}
                                onChange={onChange}
                                placeholder={"Search templates..."}
                                startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                                size={"md"}
                                variant={"primary"}
                            />
                        )}
                    </DelayedOnChange>
                </div>
                <div className={"shrink-0"}>
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onChange={value => setViewMode(value as "grid" | "list")}
                        items={[
                            { id: "grid", value: "grid", icon: <GridIcon /> },
                            { id: "list", value: "list", icon: <ListIcon /> }
                        ]}
                        variant="ghost"
                    />
                </div>
            </div>
            {viewMode === "grid" ? (
                <GalleryList>
                    {filteredTemplates.map(template => (
                        <TemplateGridItem
                            key={template.id}
                            template={template}
                            onTemplate={props.onTemplate}
                        />
                    ))}
                </GalleryList>
            ) : (
                <div className={"flex flex-col gap-y-sm"}>
                    {filteredTemplates.map(template => (
                        <TemplateListItem
                            key={template.id}
                            template={template}
                            onTemplate={props.onTemplate}
                        />
                    ))}
                </div>
            )}
        </GalleryContainer>
    );
});

export type ShouldRender = { modelIds?: string[] };

function withShouldRender<T extends DecoratableComponent>(Component: T) {
    return withDecoratorFactory<ShouldRender>()(Component, decoratorProps => {
        const { model } = useModel();

        if (decoratorProps?.modelIds?.length && !decoratorProps.modelIds.includes(model.modelId)) {
            return false;
        }

        return true;
    });
}

/**
 * We're wrapping each component with `withShouldRender`, because they're all decoratable, and `withShouldRender` attaches a
 * conditional decorator, which optionally takes a `modelIds` prop, so you can control on which models that component will be decorated.
 */
export const TemplateGallery = Object.assign(withShouldRender(Gallery), {
    Container: withShouldRender(GalleryContainer),
    List: withShouldRender(GalleryList),
    Item: withShouldRender(TemplateGridItem)
});
