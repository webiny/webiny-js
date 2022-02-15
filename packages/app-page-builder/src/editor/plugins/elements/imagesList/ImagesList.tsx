import * as React from "react";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { plugins } from "@webiny/plugins";
import { PbPageElementImagesListComponentPlugin } from "~/types";
import { Image } from "react-images";

interface ImagesListProps {
    data: {
        component: string;
        images: Image[];
    };
}
const ImagesList: React.FC<ImagesListProps> = ({ data }) => {
    const { theme } = usePageBuilder();
    const { component, images } = data;
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

export default React.memo(ImagesList);
