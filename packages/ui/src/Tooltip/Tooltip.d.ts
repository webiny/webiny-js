import * as React from "react";
import "rc-tooltip/assets/bootstrap_white.css";
import "./style.scss";
declare type Props = {
    children: React.ReactNode;
    content: React.ReactNode;
    trigger?: string;
    placement?: string;
};
declare type State = {
    tooltipIsOpen: boolean;
};
/**
 * Use Tooltip component to display a list of choices, once the handler is triggered.
 */
declare class Tooltip extends React.Component<Props, State> {
    state: {
        tooltipIsOpen: boolean;
    };
    onVisibleChange: (visible: boolean) => void;
    render(): JSX.Element;
}
export { Tooltip };
