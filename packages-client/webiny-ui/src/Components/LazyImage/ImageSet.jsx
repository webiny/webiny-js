import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ImageSet extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.interval = null;
        this.images = [];

        this.bindMethods('getImages, checkOffset');
    }

    componentDidMount() {
        super.componentDidMount();
        this.getImages();
    }

    getImages() {
        const dom = ReactDOM.findDOMNode(this);
        _.each(dom.querySelectorAll('img'), img => {
            if (img.hasAttribute('data-src')) {
                const rect = img.getBoundingClientRect();
                img.setAttribute('offset', rect.top);
                this.images.push(img);
            }
        });

        if (this.images.length > 0) {
            this.interval = setInterval(this.checkOffset, 500);
        }
    }

    checkOffset() {
        const offset = window.scrollY + window.innerHeight + this.props.offset;

        const images = [];
        this.images.map(img => {
            if (offset >= img.getAttribute('offset')) {
                img.setAttribute('src', img.getAttribute('data-src'));
            } else {
                images.push(img);
            }
        });

        this.images = images;
        if (images.length <= 0) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

}

ImageSet.defaultProps = {
    offset: 0,
    renderer() {
        return React.isValidElement(this.props.children) ? this.props.children : <webiny-image-set>{this.props.children}</webiny-image-set>;
    }
};

export default Webiny.createComponent(ImageSet);
