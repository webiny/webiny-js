import React from 'react';
import _ from 'lodash';
import { inject } from 'webiny-client';

@inject()
class ImageSet extends React.Component {
    constructor(props) {
        super(props);

        this.dom = null;
        this.interval = null;
        this.images = [];

        ['getImages, checkOffset'].map(m => this[m] = this[m].bind(this));
    }

    componentDidMount() {
        this.getImages();
    }

    getImages() {
        _.each(this.dom.querySelectorAll('img'), img => {
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

    render() {
        const { children, render } = this.props;

        if (render) {
            return render.call(this);
        }

        return React.isValidElement(children) ? children : (
            <webiny-image-set ref={ref => this.dom = ref}>{children}</webiny-image-set>
        );
    }
}

ImageSet.defaultProps = {
    offset: 0
};

export default ImageSet;
