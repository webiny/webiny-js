import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class Hide extends Webiny.Ui.Component {

}

Hide.defaultProps = {
    if: false,
    renderer() {
        let hide = false;
        if (_.isFunction(this.props.if)) {
            hide = this.props.if();
        } else if (this.props.if === true) {
            hide = true;
        }

        if (hide) {
            return <webiny-hide/>;
        }

        const children = React.Children.toArray(this.props.children);
        if (children.length === 1) {
            return <webiny-hide>{children[0]}</webiny-hide>;
        }

        return <webiny-hide>{this.props.children}</webiny-hide>;
    }
};

export default Hide;