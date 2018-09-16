import React from 'react';
import { inject } from 'webiny-app';

@inject()
class Header extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <webiny-dynamic-fieldset-header>{this.props.children}</webiny-dynamic-fieldset-header>;
    }
}

export default Header;