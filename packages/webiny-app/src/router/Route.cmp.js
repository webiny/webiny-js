import React from "react";

class Route extends React.Component {
    render() {
        const { render, component } = this.props;

        if (render) {
            return this.props.render({ ...this.props });
        }

        return React.createElement(component);
    }
}

export default Route;
