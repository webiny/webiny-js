import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false
        };
    }
    componentDidCatch() {
        this.setState({
            hasError: true
        });
    }
    render() {
        if (this.state.hasError) {
            return <h2>FAILED TO RENDER COMPONENT</h2>;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
