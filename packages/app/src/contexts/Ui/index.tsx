import React from "react";

export const UiContext = React.createContext({});

type Props = {};

type State = {
    ui: { [key: string]: any };
};

export class UiProvider extends React.Component<Props, State> {
    state: State = { ui: {} };

    setData = (setter: Function) => {
        return this.setState((state: State) => {
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

export const UiConsumer = ({ children }) => {
    return <UiContext.Consumer>{ui => React.cloneElement(children, { ui })}</UiContext.Consumer>;
};
