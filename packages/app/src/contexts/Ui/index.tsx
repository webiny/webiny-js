import React from "react";
import { UiStatePlugin } from "~/types";
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
    public override state: State = {
        ui: {}
    };

    private readonly setData = (setter: Function): void => {
        return this.setState((state: State) => {
            return { ui: { ...state.ui, ...setter(state.ui) } };
        });
    };

    public override render() {
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

export interface UiConsumerProps {
    children: React.ReactElement;
}
export const UiConsumer: React.FC<UiConsumerProps> = ({ children }) => {
    return <UiContext.Consumer>{ui => React.cloneElement(children, { ui })}</UiContext.Consumer>;
};
