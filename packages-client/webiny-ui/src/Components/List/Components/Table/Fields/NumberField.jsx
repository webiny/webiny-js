import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class PriceField extends Webiny.Ui.Component {
}

PriceField.defaultProps = {
    format: null,
    default: '-',
    renderer() {
        const value = _.get(this.props.data, this.props.name);
        const {List, ...props} = this.props;

        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => value ? Webiny.I18n.number(value, this.props.format) : this.props.default}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(PriceField, {
    modules: ['List'],
    tableField: true
});