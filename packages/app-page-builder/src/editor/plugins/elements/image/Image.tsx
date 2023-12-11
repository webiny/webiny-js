import React from "react";
import { PbEditorElement } from "~/types";
import PeImage from "./PeImage";
import { Element } from "@webiny/app-page-builder-elements/types";

interface ImageProps {
    element: PbEditorElement;
}

const Image = (props: ImageProps) => {
    const { element, ...rest } = props;
    return <PeImage element={element as Element} {...rest} />;
};

export default React.memo(Image);
