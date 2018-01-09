import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class TimeField extends Webiny.Ui.Component {

}

TimeField.defaultProps = {
    name: null,
    default: '-',
    format: null,
    renderer() {
        const {List, format, ...props} = this.props;
        const time = _.get(this.props.data, this.props.name);

        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => {
                    try {
                        return Webiny.I18n.time(time, this.props.format);
                    } catch (e) {
                        return this.props.default;
                    }
                }}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(TimeField, {modules: ['List'], tableField: true});