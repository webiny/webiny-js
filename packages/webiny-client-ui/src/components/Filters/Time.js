import React from "react";
import { createComponent, i18n } from "webiny-client";

class Time extends React.Component {
    render() {
        try {
            return <span>{i18n.time(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
}

Time.defaultProps = {
    format: null,
    default: "-",
    value: null
};

export default createComponent(Time);
