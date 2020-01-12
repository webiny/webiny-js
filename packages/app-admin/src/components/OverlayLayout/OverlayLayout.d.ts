import * as React from "react";
declare type OverlayLayoutProps = {
    barMiddle?: React.ReactNode;
    barLeft?: React.ReactNode;
    barRight?: React.ReactNode;
    children: React.ReactNode;
    onExited?: Function;
    style?: React.CSSProperties;
};
declare type State = {
    isVisible: boolean;
};
export declare class OverlayLayout extends React.Component<OverlayLayoutProps, State> {
    constructor(props: any);
    static defaultProps: {
        onExited: () => void;
    };
    state: {
        isVisible: boolean;
    };
    hideComponent: () => void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export {};
