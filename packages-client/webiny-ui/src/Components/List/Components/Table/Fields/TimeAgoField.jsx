import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class TimeAgoField extends Webiny.Ui.Component {

}

TimeAgoField.defaultProps = {
    renderer() {
        const {List, moment, data, name, ...props} = this.props;

        let value = data[name];
        if (value) {
            value = moment(value).fromNow();
        }


        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => value || this.props.default}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(TimeAgoField, {modules: ['List', {moment: 'Webiny/Vendors/Moment'}], tableField: true});