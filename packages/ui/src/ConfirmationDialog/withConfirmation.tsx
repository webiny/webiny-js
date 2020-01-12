import * as React from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";

type ConfirmationProps = {
    title?: React.ReactNode;
    message?: React.ReactNode;
};

type WithConfirmationParams = (props) => ConfirmationProps;

export type WithConfirmationProps = {
    showConfirmation: (confirm: Function, cancel: Function) => void;
};

export const withConfirmation = (dialogProps: WithConfirmationParams): Function => {
    return (Component: typeof React.Component) => {
        return function withConfirmationRender(ownProps) {
            const props = typeof dialogProps === "function" ? dialogProps(ownProps) : dialogProps;
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
