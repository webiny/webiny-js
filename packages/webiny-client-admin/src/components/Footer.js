import React from "react";
import { Component } from "webiny-client";

@Component()
class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return null;
    }
}

export default Footer;
