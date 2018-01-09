import React from 'react';
import {Webiny} from 'webiny-client';

class Gravatar extends Webiny.Ui.Component {

}

Gravatar.defaultProps = {
    hash: null,
    size: 48,
    className: null,
    renderer() {
        const props = {
            src: '//www.gravatar.com/avatar/' + this.props.hash + '?s=' + this.props.size,
            width: this.props.size,
            height: this.props.size,
            className: this.props.className
        };

        return (
            <img {...props}/>
        );
    }
};

export default Webiny.createComponent(Gravatar);