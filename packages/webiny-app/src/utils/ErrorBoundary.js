import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false
        };
    }
    componentDidCatch(error) {
        console.log(error);
        this.setState({
            hasError: true
        });
    }
    render() {
        if (this.state.hasError) {
            return <h2>Something went wrong with this component!</h2>;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
