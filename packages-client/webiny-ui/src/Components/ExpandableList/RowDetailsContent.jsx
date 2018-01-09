import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class RowDetailsContent extends Webiny.Ui.Component {

}

RowDetailsContent.defaultProps = {
    renderer() {
        let content = this.props.children;
        if (_.isFunction(this.props.children)) {
            content = this.props.children.call(this);
        }

        return <div>{content}</div>;
    }
};

export default RowDetailsContent;