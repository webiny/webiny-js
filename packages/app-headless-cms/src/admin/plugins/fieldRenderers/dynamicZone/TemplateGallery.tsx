import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/highlight_off.svg";
import { DecoratableComponent, makeDecoratable, withDecoratorFactory } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { CmsDynamicZoneTemplate } from "~/types";
import { useModel, useModelField } from "~/admin/hooks";
import { TemplateItem } from "./TemplateItem";

export interface TemplateGalleryContainerProps {
    children: React.ReactNode;
}

const GalleryContainer = makeDecoratable(
    "TemplateGalleryContainer",
    (props: TemplateGalleryContainerProps) => {
        return <>{props.children}</>;
    }
);

const DefaultGalleryList = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px;
`;

export interface TemplateGalleryListProps {
    children: React.ReactNode;
}

const GalleryList = makeDecoratable("TemplateGalleryList", (props: TemplateGalleryListProps) => {
    return <DefaultGalleryList>{props.children}</DefaultGalleryList>;
});

export interface CloseGalleryProps {
    onClose: () => void;
}

const CloseGallery = makeDecoratable("TemplateGalleryClose", (props: CloseGalleryProps) => {
    return <IconButton onClick={props.onClose} icon={<CloseIcon />} />;
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
