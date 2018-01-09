import React from 'react';
import {Webiny} from 'webiny-client';

class Image extends Webiny.Ui.Component {

}

Image.defaultProps = {
    alt: null,
    className: null,
    src: null,
    width: null,
    height: null,
    renderer() {
        return (
            <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                data-src={this.props.src}
                width={this.props.width}
                height={this.props.height}
                alt={this.props.alt}
                className={this.props.className}/>
        );
    }
};

export default Webiny.createComponent(Image);
