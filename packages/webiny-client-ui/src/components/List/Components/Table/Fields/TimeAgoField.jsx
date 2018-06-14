import React from "react";
import { inject } from "webiny-client";

@inject({
    modules: ["List", { moment: "Vendor.Moment" }],
    tableField: true
})
class TimeAgoField extends React.Component {
    render() {
        const { modules: { List, moment }, data, name, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        let value = data[name];
        if (value) {
            value = moment(value).fromNow();
        }

        return <List.Table.Field {...props}>{() => value || this.props.default}</List.Table.Field>;
    }
}

export default TimeAgoField;
