import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class RowDetailsList extends Webiny.Ui.Component {

}

RowDetailsList.defaultProps = {
    renderer() {
        let content = this.props.children;
        if (_.isFunction(this.props.children)) {
            content = this.props.children.call(this, {data: this.props.data, $this: this});
        }

        return <div>{content}</div>;
    }
};

export default RowDetailsList;