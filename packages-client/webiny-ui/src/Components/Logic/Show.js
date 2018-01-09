import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class Show extends Webiny.Ui.Component {

}

Show.defaultProps = {
    if: false,
    renderer() {
        let show = false;
        if (_.isFunction(this.props.if)) {
            show = this.props.if();
        } else if (this.props.if === true) {
            show = true;
        }

        if (!show) {
            return <webiny-show/>;
        }

        const children = React.Children.toArray(this.props.children);
        if (children.length === 1) {
            return <webiny-show>{children[0]}</webiny-show>;
        }

        return <webiny-show>{this.props.children}</webiny-show>;
    }
};

export default Show;