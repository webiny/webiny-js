import React from "react";
export declare const UiContext: React.Context<{}>;
declare type Props = {};
declare type State = {
    ui: {
        [key: string]: any;
    };
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
export declare class UiProvider extends React.Component<Props, State> {
    state: State;
    setData: (setter: Function) => void;
    render(): JSX.Element;
}
export declare const UiConsumer: ({ children }: {
    children: any;
}) => JSX.Element;
export {};
