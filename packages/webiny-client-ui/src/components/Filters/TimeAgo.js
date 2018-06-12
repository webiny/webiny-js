import React from "react";
import { createComponent } from "webiny-client";

class TimeAgo extends React.Component {
    render() {
        const { modules: { moment } } = this.props;
        const timeAgo = moment(this.props.value, moment.ISO_8601);

        return <span>{timeAgo.isValid() ? timeAgo.fromNow() : this.props.invalidMessage}</span>;
    }
}

TimeAgo.defaultProps = {
    value: null,
    invalidMessage: "invalid date format"
};

export default createComponent(TimeAgo, { modules: [{ moment: "Webiny/Vendors/Moment" }] });
