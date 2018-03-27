import React from "react";
import { i18n, createComponent } from "webiny-client";

class DateTime extends React.Component {
    render() {
        try {
            return <span>{i18n.dateTime(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
}

DateTime.defaultProps = {
    format: null,
    default: "-",
    value: null
};

export default createComponent(DateTime);
