import * as React from "react";
interface ChildrenRenderProp {
    showConfirmation: (onAccept?: Function, onCancel?: Function) => any;
}
interface ConfirmationCallbacks {
    onAccept: Function;
    onCancel: Function;
}
declare type Props = {
    title?: React.ReactNode;
    message?: React.ReactNode;
    loading?: React.ReactNode;
    children: (props: ChildrenRenderProp) => React.ReactNode;
};
declare type State = {
    show: boolean;
    loading: boolean;
};
/**
 * Use ConfirmationDialog component to display a list of choices, once the handler is triggered.
 */
declare class ConfirmationDialog extends React.Component<Props, State> {
    static defaultProps: {
        title: string;
        message: string;
        loading: JSX.Element;
    };
    __isMounted: boolean;
    callbacks: ConfirmationCallbacks;
    state: {
        show: boolean;
        loading: boolean;
    };
    componentDidMount(): void;
    componentWillUnmount(): void;
    showConfirmation: (onAccept?: Function, onCancel?: Function) => void;
    hideConfirmation: () => void;
    onAccept: () => Promise<void>;
    onCancel: () => Promise<void>;
    render(): JSX.Element;
}
export { ConfirmationDialog };
