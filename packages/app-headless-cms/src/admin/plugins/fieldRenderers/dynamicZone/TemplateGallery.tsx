import React from "react";
import { ReactComponent as CloseIcon } from "@webiny/icons/highlight_off.svg";
import { IconButton, Tooltip } from "@webiny/admin-ui";
import type { DecoratableComponent } from "@webiny/app-admin";
import { makeDecoratable, withDecoratorFactory } from "@webiny/app-admin";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { useModel, useModelField } from "~/admin/hooks/index.js";
import { TemplateItem } from "./TemplateItem.js";

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
    return (
        <div
            className={
                "p-md rounded-sm bg-neutral-dimmed grid grid-cols-4 gap-md"
            }
        >
            {props.children}
        </div>
    );
});

export interface CloseGalleryProps {
    onClose: () => void;
}

const CloseGallery = makeDecoratable("TemplateGalleryClose", (props: CloseGalleryProps) => {
    return (
        <div className={"w-full text-center mt-md"}>
            <Tooltip
                content={"Close"}
                trigger={
                    <IconButton
                        onClick={props.onClose}
                        icon={<CloseIcon />}
                        size={"lg"}
                        variant={"ghost"}
                    />
                }
            />
        </div>
    );
});

export interface TemplateGalleryProps {
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
    onClose: () => void;
    templates?: CmsDynamicZoneTemplate[];
}

const Gallery = makeDecoratable("TemplateGallery", (props: TemplateGalleryProps) => {
    const { field } = useModelField();
    const templates = props.templates || field.settings?.templates || [];

    return (
        <GalleryContainer>
            <GalleryList>
                {templates.map(template => (
                    <TemplateItem
                        key={template.id}
                        template={template}
                        onTemplate={props.onTemplate}
                    />
                ))}
            </GalleryList>
            <CloseGallery onClose={props.onClose} />
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
    Item: withShouldRender(TemplateItem),
    Close: withShouldRender(CloseGallery)
});
