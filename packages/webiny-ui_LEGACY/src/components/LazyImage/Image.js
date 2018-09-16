import React from 'react';
import { inject } from 'webiny-app';

@inject()
class Image extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

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
}

Image.defaultProps = {
    alt: null,
    className: null,
    src: null,
    width: null,
    height: null
};

export default Image;
