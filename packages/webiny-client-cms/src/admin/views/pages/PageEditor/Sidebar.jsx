import React from "react";

export default class Sidebar extends React.Component {
    state = {
        height: "100vh"
    };

    componentDidMount() {
        this.setState({ height: document.documentElement.clientHeight - (this.props.offset || 0) });
    }

    render() {
        return this.props.children({ height: this.state.height });
    }
}
