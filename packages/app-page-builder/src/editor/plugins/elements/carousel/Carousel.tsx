import React from "react";
import { PbEditorElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import PeCarousel from "./PeCarousel";
import { Element } from "@webiny/app-page-builder-elements/types";

interface CarouselProps {
    element: PbEditorElement;
}

const Carousel: React.FC<CarouselProps> = props => {
    if (isLegacyRenderingEngine) {
        return <></>;
    }

    const { element, ...rest } = props;
    return <PeCarousel element={element as Element} {...rest} />;
};

export default Carousel;
