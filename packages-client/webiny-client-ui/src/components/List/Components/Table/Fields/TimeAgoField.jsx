import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-client';

class TimeAgoField extends React.Component {
    render() {
        const {List, moment, data, name, render, ...props} = this.props;

        if (render) {
            return render.call(this);
        }

        let value = data[name];
        if (value) {
            value = moment(value).fromNow();
        }


        return (
            <List.Table.Field {...props}>
                {() => value || this.props.default}
            </List.Table.Field>
        );
    }
}

export default createComponent(TimeAgoField, {modules: ['List', {moment: 'Vendor.Moment'}], tableField: true});