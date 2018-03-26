import React from 'react';
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-client';

class PriceField extends React.Component {
    render() {
        const { List, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        const value = _.get(this.props.data, this.props.name);

        return (
            <List.Table.Field {...props}>
                {() => value ? i18n.number(value, this.props.format) : this.props.default}
            </List.Table.Field>
        );
    }
}

PriceField.defaultProps = {
    format: null,
    default: '-'
};

export default createComponent(PriceField, {
    modules: ['List'],
    tableField: true
});