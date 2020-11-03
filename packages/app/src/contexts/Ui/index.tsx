import React from "react";
import { UiStatePlugin } from "@webiny/app/types";
import { plugins } from "@webiny/plugins";

export const UiContext = React.createContext({});

type Props = {};

type State = {
    ui: { [key: string]: any };
};

interface UiData {
    [key: string]: any;
}

interface UiDataSetter {
    (ui: UiData): UiData;
}

export interface UiContextValue {
    setState: (setter: UiDataSetter) => void;
    [key: string]: any;
}

export class UiProvider extends React.Component<Props, State> {
    state: State = { ui: {} };

    setData = (setter: Function) => {
        return this.setState((state: State) => {
            return { ui: { ...state.ui, ...setter(state.ui) } };
        });
    };

    render() {
        const value: UiContextValue = { ...this.state.ui, setState: this.setData };
        const uiStatePlugins = plugins.byType<UiStatePlugin>("ui-state");
        return (
            <UiContext.Provider value={value}>
                {uiStatePlugins.map(pl => React.cloneElement(pl.render(), { key: pl.name }))}
                {this.props.children}
            </UiContext.Provider>
        );
    }
}

export const UiConsumer = ({ children }) => {
    return <UiContext.Consumer>{ui => React.cloneElement(children, { ui })}</UiContext.Consumer>;
};
