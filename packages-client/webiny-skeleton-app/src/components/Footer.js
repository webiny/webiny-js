import React from "react";
import { createComponent } from "webiny-client";

class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return null;
    }
}

export default createComponent(Footer);
