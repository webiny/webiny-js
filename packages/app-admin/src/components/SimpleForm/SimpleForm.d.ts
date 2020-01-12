import * as React from "react";
export declare const SimpleForm: (props: {
    children: React.ReactNode;
    noElevation?: boolean;
}) => JSX.Element;
export declare const SimpleFormHeader: (props: {
    title: string;
    icon?: React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)>;
    children?: React.ReactNode;
}) => JSX.Element;
export declare const SimpleFormFooter: (props: {
    children: React.ReactNode;
}) => JSX.Element;
export declare const SimpleFormContent: (props: {
    children: any;
}) => any;
