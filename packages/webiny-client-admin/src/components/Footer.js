import React from "react";
import { inject } from "webiny-client";

@inject()
class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return null;
    }
}

export default Footer;
