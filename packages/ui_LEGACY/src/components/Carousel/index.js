import React from "react";
import $ from "jquery";
import _ from "lodash";
import { inject, i18n } from "webiny-app";
import classSet from "classnames";

const t = i18n.namespace("Webiny.Ui.Carousel");
@inject({
    modules: [
        // owl.carousel attaches itself to jQuery object and does not export anything
        "Vendor.OwlCarousel"
    ]
}) // owl.carousel attaches itself to jQuery object and does not export anything
// owl.carousel attaches itself to jQuery object and does not export anything
// owl.carousel attaches itself to jQuery object and does not export anything
class Carousel extends React.Component {
    constructor(props) {
        super(props);

        this.carousel = null;
        this.dom = null;

        this.getCarouselWrapper = this.getCarouselWrapper.bind(this);
    }

    componentDidMount() {
        this.initCarousel();
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(this.props.children, nextProps.children);
    }

    componentWillUpdate() {
        this.carousel.trigger("destroy.owl.carousel");
    }

    componentDidUpdate() {
        this.initCarousel();
    }

    getCarouselWrapper() {
        return this.dom;
    }

    initCarousel() {
        this.carousel = $(this.getCarouselWrapper()).owlCarousel(this.props);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <div
                ref={ref => (this.dom = ref)}
                className={classSet("owl-carousel owl-theme", this.props.className)}
            >
                {this.props.children}
            </div>
        );
    }
}

Carousel.defaultProps = {
    loop: true,
    margin: 10,
    nav: false,
    items: 1,
    center: false,
    autoWidth: false,
    URLhashListener: false,
    navRewind: false,
    navText: [t`prev`, t`next`],
    dots: true,
    lazyLoad: false,
    autoplay: false,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    video: false,
    videoHeight: false,
    videoWidth: false,
    animateOut: false,
    animateIn: false,
    itemElement: "div",
    stageElement: "div",
    mouseDrag: false,
    className: null
};

export default Carousel;
