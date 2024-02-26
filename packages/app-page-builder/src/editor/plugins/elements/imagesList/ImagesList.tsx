import React from "react";
import { PbEditorElement } from "~/types";
import PeImagesList from "./PeImagesList";

import { Element } from "@webiny/app-page-builder-elements/types";

interface ImagesListProps {
    element: PbEditorElement;
}

const ImagesList = (props: ImagesListProps) => {
    const { element, ...rest } = props;
    return <PeImagesList element={element as Element} {...rest} />;
};

export default ImagesList;
