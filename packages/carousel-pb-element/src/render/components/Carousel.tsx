import React from "react";
import { Carousel as ResponsiveCarousel } from "react-responsive-carousel";
// Necessary styles
import "react-responsive-carousel/lib/styles/carousel.min.css";

const Carousel: React.FunctionComponent<{ children: any }> = ({ children }) => {
    return (
        <ResponsiveCarousel
            showArrows={true}
            showThumbs={false}
            showIndicators={true}
            showStatus={false}
            useKeyboardArrows={true}
        >
            {children}
        </ResponsiveCarousel>
    );
};

export default Carousel;
