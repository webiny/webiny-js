import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class Field extends Webiny.Ui.Component {

}

Field.defaultProps = {
    className: null,
    onClick: _.noop,
    width: null,
    renderer() {
        const className = this.classSet(this.props.className, 'expandable-list__row__fields__field flex-cell flex-width-' + this.props.width);
        let content = this.props.children;
        if (_.isFunction(content)) {
            content = content.call(this, {data: this.props.data, $this: this});
        }
        return (
            <div className={className} onClick={this.props.onClick}>{content}</div>
        );
    }
};

export default Field;