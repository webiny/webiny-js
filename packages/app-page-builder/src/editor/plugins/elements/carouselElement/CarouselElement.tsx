import React from "react";
import { PbEditorElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import PeCarouselElement from "./PeCarouselElement";
import { Element } from "@webiny/app-page-builder-elements/types";

interface CarouselElementProps {
    element: PbEditorElement;
}

const CarouselElement: React.FC<CarouselElementProps> = props => {
    if (isLegacyRenderingEngine) {
        return <></>;
    }

    const { element, ...rest } = props;
    return <PeCarouselElement element={element as Element} {...rest} />;
};

export default CarouselElement;
