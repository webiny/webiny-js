import React from "react";
import { isEqual } from "lodash";
const { Provider, Consumer } = React.createContext();

export const SecurityProvider = ({ security, children }) => {
    return <Provider value={security}>{children}</Provider>;
};

export const SecurityConsumer = ({ children }) => {
    return (
        <Consumer>
            {security => <EnsureChange security={security}>{children}</EnsureChange>}
        </Consumer>
    );
};

class EnsureChange extends React.Component {
    shouldComponentUpdate(props) {
        return !isEqual(props.security.identity, this.props.security.identity);
    }

    render() {
        console.log("RENDERING SECURITY CONSUMER");
        return React.cloneElement(this.props.children, { security: this.props.security });
    }
}
