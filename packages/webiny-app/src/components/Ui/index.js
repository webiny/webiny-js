import React from "react";
const { Provider, Consumer } = React.createContext();

export class UiProvider extends React.Component {
    state = { ui: {} };

    setData = (setter: Function) => {
        return this.setState(state => {
            return { ui: { ...state.ui, ...setter(state.ui) } };
        });
    };

    render() {
        return (
            <Provider value={{ ...this.state.ui, setState: this.setData }}>
                {this.props.children}
            </Provider>
        );
    }
}

export const UiConsumer = ({ children }) => {
    return <Consumer>{ui => React.cloneElement(children, { ui })}</Consumer>;
};
