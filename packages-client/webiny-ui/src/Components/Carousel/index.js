import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Carousel
 */
class Carousel extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.carousel = null;

        this.bindMethods('getCarouselWrapper');
    }

    componentDidMount() {
        super.componentDidMount();
        this.initCarousel();
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(this.props.children, nextProps.children);
    }

    componentWillUpdate(props, state){
        super.componentWillUpdate(props, state);
        this.carousel.trigger('destroy.owl.carousel');
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.initCarousel();
    }

    getCarouselWrapper() {
        return ReactDOM.findDOMNode(this);
    }

    initCarousel() {
        this.carousel = $(this.getCarouselWrapper()).owlCarousel(this.props);
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
    navText: [Webiny.I18n('prev'), Webiny.I18n('next')],
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
    itemElement: 'div',
    stageElement: 'div',
    mouseDrag: false,
    className: null,
    renderer() {
        return (
            <div className={this.classSet('owl-carousel owl-theme', this.props.className)}>
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(Carousel, {
    modules: [
        // owl.carousel attaches itself to jQuery object and does not export anything
        'Webiny/Vendors/OwlCarousel'
    ]
});
