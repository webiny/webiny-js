import React from 'react';
import { createComponent } from 'webiny-client';

class Header extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <webiny-dynamic-fieldset-header>{this.props.children}</webiny-dynamic-fieldset-header>;
    }
}

export default createComponent(Header);