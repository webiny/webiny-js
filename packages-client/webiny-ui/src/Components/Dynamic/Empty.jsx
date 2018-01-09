import React from 'react';
import {Webiny} from 'webiny-client';

class Empty extends Webiny.Ui.Component {

}

Empty.defaultProps = {
    renderer() {
        return <webiny-dynamic-fieldset-empty>{this.props.children}</webiny-dynamic-fieldset-empty>;
    }
};

export default Webiny.createComponent(Empty);