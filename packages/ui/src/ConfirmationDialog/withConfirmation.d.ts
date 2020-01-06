import * as React from "react";
declare type ConfirmationProps = {
    title?: React.ReactNode;
    message?: React.ReactNode;
};
declare type WithConfirmationParams = (props: Object) => ConfirmationProps;
export declare type WithConfirmationProps = {
    showConfirmation: (confirm: Function, cancel: Function) => void;
};
export declare const withConfirmation: (dialogProps: WithConfirmationParams) => Function;
export {};
