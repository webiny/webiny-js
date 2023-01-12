import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeImagesList from "./PeImagesList";
import PbImagesList from "./PbImagesList";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface ImagesListProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const ImagesList: React.FC<ImagesListProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbImagesList {...props} element={props.element} />;
    }

    console.log('dobeo props', Object.keys(props))
    const { element, ...rest } = props;
    return <PeImagesList element={element as Element} {...rest} />;
};

export default ImagesList;
