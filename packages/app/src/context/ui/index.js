// @flow
import React from "react";

export const UiContext = React.createContext();

export class UiProvider extends React.Component<*, *> {
    state = { ui: {} };

    setData = (setter: Function) => {
        return this.setState(state => {
            return { ui: { ...state.ui, ...setter(state.ui) } };
        });
    };

    render() {
        return (
            <UiContext.Provider value={{ ...this.state.ui, setState: this.setData }}>
                {this.props.children}
            </UiContext.Provider>
        );
    }
}

export const UiConsumer = ({ children }: Object) => {
    return <UiContext.Consumer>{ui => React.cloneElement(children, { ui })}</UiContext.Consumer>;
};
