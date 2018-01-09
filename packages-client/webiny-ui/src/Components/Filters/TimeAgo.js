import React from 'react';
import {Webiny} from 'webiny-client';

class TimeAgo extends Webiny.Ui.Component {

}

TimeAgo.defaultProps = {
    value: null,
    invalidMessage: 'invalid date format',
    renderer() {
        const {moment} = this.props;
        const timeAgo = moment(this.props.value, moment.ISO_8601);

        return (
            <span>{timeAgo.isValid() ? timeAgo.fromNow() : this.props.invalidMessage}</span>
        );
    }
};


export default Webiny.createComponent(TimeAgo, {modules: [{moment: 'Webiny/Vendors/Moment'}]});
