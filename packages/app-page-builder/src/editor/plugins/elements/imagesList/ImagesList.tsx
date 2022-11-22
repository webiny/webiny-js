import * as React from "react";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { plugins } from "@webiny/plugins";
import { PbEditorElement, PbPageElementImagesListComponentPlugin } from "~/types";
import { makeComposable } from "@webiny/react-composition";

interface ImagesListProps {
    element: PbEditorElement;
}
const ImagesList: React.FC<ImagesListProps> = ({ element }) => {
    const { theme } = usePageBuilder();
    const { component, images } = element.data;
    const components = plugins.byType<PbPageElementImagesListComponentPlugin>(
        "pb-page-element-images-list-component"
    );
    const imageList = components.find(cmp => cmp.componentName === component);

    if (!imageList) {
        return <div>Selected image gallery component not found!</div>;
    }

    const { component: ListComponent } = imageList;
    if (!ListComponent) {
        return <div>You must select a component to render your image gallery!</div>;
    }

    return <ListComponent data={images} theme={theme} />;
};

export default makeComposable(
    "ImagesList",
    React.memo(({ element }: { element: PbEditorElement }) => {
        return <ImagesList element={element} />;
    })
);
