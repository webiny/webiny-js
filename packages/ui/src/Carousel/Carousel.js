//@flow
import * as React from "react";
import NukaCarousel from "nuka-carousel";
import pick from "lodash/pick";

type Props = {
    // slides as set of HTMLElements
    children: React.Node,

    // after slide callback
    afterSlide?: Function,

    // should the slides auto play, default set to false
    autoplay?: boolean,

    // autoplay interval in ms, default set to 3000
    autoplayInterval?: number,

    // before slide callback
    beforeSlide?: Function,

    // enable mouse drag/swipe interaction
    dragging?: boolean,

    // animation easing function, see more: https://github.com/d3/d3-ease
    easing?: string,

    // how should the height of the frame be adjusted, default set to "first"
    heightMode?: "first" | "current" | "max",

    // pause on hover, default set to true
    pauseOnHover?: boolean,

    // manually define which slide should be shown
    slideIndex?: number,

    // animation duration in ms
    speed?: number,

    // enable touch controls.
    swiping?: boolean,

    // set slide transition mode
    transitionMode?: "scroll" | "fade",

    // render method for the next slide button
    renderNextSlide?: Function,

    // render method for the previous slide button
    renderPreviousSlide?: Function,

    // render method for the central navigation
    renderBottomNav?: Function
};

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
