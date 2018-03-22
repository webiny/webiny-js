import React from 'react';
import _ from 'lodash';
import classSet from "classnames";
import { createComponent } from 'webiny-client';

class Field extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const className = classSet(this.props.className, 'expandable-list__row__fields__field flex-cell flex-width-' + this.props.width);
        let content = this.props.children;
        if (_.isFunction(content)) {
            content = content.call(this, { data: this.props.data, $this: this });
        }
        return (
            <div className={className} onClick={this.props.onClick}>{content}</div>
        );
    }
}

Field.defaultProps = {
    className: null,
    onClick: _.noop,
    width: null
};

export default createComponent(Field);