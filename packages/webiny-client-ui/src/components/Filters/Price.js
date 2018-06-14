import React from "react";
import { inject, i18n } from "webiny-client";

@inject()
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

export default Price;
