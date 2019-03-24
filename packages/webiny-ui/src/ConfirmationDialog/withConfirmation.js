// @flow
import * as React from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";

type ConfirmationProps = {
    title?: React.Node,
    message?: React.Node
};

type WithConfirmationParams = (props: Object) => ConfirmationProps;

export type WithConfirmationProps = {
    showConfirmation: (confirm: Function, cancel: Function) => void
};

export const withConfirmation = (dialogProps: WithConfirmationParams): Function => {
    return (Component: typeof React.Component) => {
        return function withConfirmationRender(ownProps) {
            const props = typeof dialogProps === "function" ? dialogProps(ownProps) : ownProps;
            return (
                <ConfirmationDialog {...props}>
                    {({ showConfirmation }) => (
                        <Component {...ownProps} showConfirmation={showConfirmation} />
                    )}
                </ConfirmationDialog>
            );
        };
    };
};
