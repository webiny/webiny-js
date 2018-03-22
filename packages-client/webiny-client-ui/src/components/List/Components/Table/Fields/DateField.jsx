import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class DateField extends Webiny.Ui.Component {

}

DateField.defaultProps = {
    name: null,
    default: '-',
    format: null,
    renderer() {
        const {List, format, ...props} = this.props;
        const date = _.get(this.props.data, this.props.name);

        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => {
                    try {
                        return Webiny.I18n.date(date, this.props.format);
                    } catch (e) {
                        return this.props.default;
                    }
                }}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(DateField, {modules: ['List'], tableField: true});