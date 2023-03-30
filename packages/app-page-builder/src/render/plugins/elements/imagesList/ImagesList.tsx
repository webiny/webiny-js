import * as React from "react";
import warning from "warning";
import { plugins } from "@webiny/plugins";
import { PbPageElementImagesListComponentPlugin, PbTheme } from "~/types";
import { Image } from "react-images";

/**
 * Figure out better data type.
 */
// TODO @ts-refactor
export interface ImagesListProps {
    data: {
        component: string;
        images: Image[];
    };
    theme: PbTheme;
}
const ImagesListComponent: React.VFC<ImagesListProps> = ({ data, theme }) => {
    const { component } = data;
    const listComponentPlugins = plugins.byType<PbPageElementImagesListComponentPlugin>(
        "pb-page-element-images-list-component"
    );

    const imagesList = listComponentPlugins.find(cmp => cmp.componentName === component);
    if (!imagesList) {
        warning(false, `Images list component "${component}" is missing!`);
        return null;
    }

    const { component: ListComponent } = imagesList;

    if (!ListComponent) {
        warning(false, `React component is not defined for "${component}"!`);
        return null;
    }

    return <ListComponent data={data.images || []} theme={theme} />;
};

export const ImagesList: React.VFC<ImagesListProps> = React.memo(ImagesListComponent);
