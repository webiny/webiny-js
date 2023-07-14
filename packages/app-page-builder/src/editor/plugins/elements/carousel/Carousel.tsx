import React from "react";
import { PbEditorElement } from "~/types";

import PeCarousel from "./PeCarousel";
import { Element } from "@webiny/app-page-builder-elements/types";

interface CarouselProps {
    element: PbEditorElement;
}

const Carousel: React.FC<CarouselProps> = props => {
    const { element, ...rest } = props;
    return <PeCarousel element={element as Element} {...rest} />;
};

export default Carousel;
