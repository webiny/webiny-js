import React from "react";
import { createComponent, i18n } from "webiny-client";

class Price extends React.Component {
    render() {
        try {
            return <span>{i18n.price(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
}

Price.defaultProps = {
    format: null,
    default: "-",
    value: null
};

export default createComponent(Price);
