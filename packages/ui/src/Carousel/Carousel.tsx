import * as React from "react";
import NukaCarousel, { CarouselProps, CarouselRenderControl } from "nuka-carousel";
import pick from "lodash/pick";

type Props = CarouselProps & {
    // slides as set of HTMLElements
    children: React.ReactNode;

    // render method for the next slide button
    renderNextSlide?: CarouselRenderControl | null;

    // render method for the previous slide button
    renderPreviousSlide?: CarouselRenderControl | null;

    // render method for the central navigation
    renderBottomNav?: CarouselRenderControl | null;
}

class Carousel extends React.Component<Props> {
    static defaultProps = {
        swiping: true,
        dragging: false,
        heightMode: "first",
        easing: "easeExpInOut"
    };

    static nukaProps = [
        "children",
        "afterSlide",
        "autoplay",
        "autoplayInterval",
        "beforeSlide",
        "dragging",
        "easing",
        "heightMode",
        "pauseOnHover",
        "slideIndex",
        "speed",
        "swiping",
        "transitionMode"
    ];

    render() {
        return (
            <NukaCarousel
                {...pick(this.props, Carousel.nukaProps)}
                {...(this.props.renderPreviousSlide
                    ? { renderCenterLeftControls: this.props.renderPreviousSlide }
                    : {})}
                {...(this.props.renderNextSlide
                    ? { renderCenterRightControls: this.props.renderNextSlide }
                    : {})}
                {...(this.props.renderBottomNav
                    ? { renderBottomCenterControls: this.props.renderBottomNav }
                    : {})}
            >
                {this.props.children}
            </NukaCarousel>
        );
    }
}

export default Carousel;
