import React from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-client";

class DateTimeField extends React.Component {
    render() {
        const { modules: { List }, format, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        const datetime = _.get(this.props.data, this.props.name);

        return (
            <List.Table.Field {...props}>
                {() => {
                    try {
                        return <span>{i18n.dateTime(datetime, format)}</span>;
                    } catch (e) {
                        return this.props.default;
                    }
                }}
            </List.Table.Field>
        );
    }
}

DateTimeField.defaultProps = {
    name: null,
    default: "-",
    format: null
};

export default createComponent(DateTimeField, { modules: ["List"], tableField: true });
