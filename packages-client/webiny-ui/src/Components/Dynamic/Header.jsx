import React from 'react';
import {Webiny} from 'webiny-client';

class Header extends Webiny.Ui.Component {

}

Header.defaultProps = {
    renderer() {
        return <webiny-dynamic-fieldset-header>{this.props.children}</webiny-dynamic-fieldset-header>;
    }
};

export default Webiny.createComponent(Header);