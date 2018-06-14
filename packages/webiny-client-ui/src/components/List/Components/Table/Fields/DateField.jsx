import React from 'react';
import _ from 'lodash';
import { inject, i18n } from 'webiny-client';

@inject({ modules: ['List'], tableField: true })
class DateField extends React.Component {
    render() {
        const { modules: { List }, format, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        const date = _.get(this.props.data, this.props.name);

        return (
            <List.Table.Field {...props}>
                {() => {
                    try {
                        return i18n.date(date, format);
                    } catch (e) {
                        return this.props.default;
                    }
                }}
            </List.Table.Field>
        );
    }
}

DateField.defaultProps = {
    name: null,
    default: '-',
    format: null
};

export default DateField;