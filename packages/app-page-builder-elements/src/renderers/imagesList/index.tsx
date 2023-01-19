import React from "react";
import {
    ImagesListComponent as RenderImagesListComponent,
    Image
} from "~/renderers/imagesList/types";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export interface ImagesListComponent {
    id: string;
    name: string;
    component: RenderImagesListComponent;
}

export interface ImagesListElementData {
    component: string;
    images: Image[];
}

export type ImagesListRenderer = ReturnType<typeof createImagesList>;

export interface Props {
    images?: Image[];
}

export interface CreateImagesListParams {
    imagesListComponents: ImagesListComponent[] | (() => ImagesListComponent[]);
}

export const createImagesList = (params: CreateImagesListParams) => {
    const { imagesListComponents } = params;

    return createRenderer<Props>(props => {
        const { getElement } = useRenderer();

        const element = getElement<ImagesListElementData>();

        let imagesListComponentsList: ImagesListComponent[];
        if (typeof imagesListComponents === "function") {
            imagesListComponentsList = imagesListComponents();
        } else {
            imagesListComponentsList = imagesListComponents;
        }

        const imagesListComponent = imagesListComponentsList.find(
            item => item.id === element.data.component
        );
        if (!imagesListComponent) {
            return <div>Selected page list component not found!</div>;
        }

        const { component: ImagesListComponent } = imagesListComponent;

        return <ImagesListComponent images={props.images || element.data.images} />;
    });
};
