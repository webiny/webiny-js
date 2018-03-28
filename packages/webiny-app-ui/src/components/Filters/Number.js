import React from "react";
import { createComponent, i18n } from "webiny-app";

class Number extends React.Component {
    render() {
        try {
            return <span>{i18n.number(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
}

Number.defaultProps = {
    format: null,
    default: "-",
    value: null
};

export default createComponent(Number);
