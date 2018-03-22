import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class DateTimeField extends Webiny.Ui.Component {

}

DateTimeField.defaultProps = {
    name: null,
    default: '-',
    format: null,
    renderer() {
        const {List, format, ...props} = this.props;
        const datetime = _.get(this.props.data, this.props.name);

        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => {
                    try {
                        return Webiny.I18n.datetime(datetime, this.props.format);
                    } catch (e) {
                        return this.props.default;
                    }
                }}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(DateTimeField, {modules: ['List'], tableField: true});