import React from "react";
import { createComponent } from "webiny-app";

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

export default createComponent(TimeAgoField, {
    modules: ["List", { moment: "Vendor.Moment" }],
    tableField: true
});
