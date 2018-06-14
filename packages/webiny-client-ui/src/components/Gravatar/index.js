import React from "react";
import { Component } from "webiny-client";

@Component()
class Gravatar extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const props = {
            src: "//www.gravatar.com/avatar/" + this.props.hash + "?s=" + this.props.size,
            width: this.props.size,
            height: this.props.size,
            className: this.props.className
        };

        return <img {...props} />;
    }
}

Gravatar.defaultProps = {
    hash: null,
    size: 48,
    className: null
};

export default Gravatar;
