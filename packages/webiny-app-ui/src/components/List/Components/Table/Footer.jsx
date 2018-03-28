import React from 'react';
import { createComponent } from 'webiny-app';

class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <tfoot>
            <tr/>
            </tfoot>
        );
    }
}

export default createComponent(Footer);