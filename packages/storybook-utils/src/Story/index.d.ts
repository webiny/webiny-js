import * as React from "react";
export declare class Story extends React.Component<{
    children: React.ReactNode;
}> {
    render(): JSX.Element;
}
declare type StorySandboxProps = {
    children: React.ReactNode;
    title?: React.ReactNode;
};
export declare const StorySandbox: (props: StorySandboxProps) => JSX.Element;
declare type StoryReadmeProps = {
    children: React.ReactNode;
};
export declare const StoryReadme: ({ children }: StoryReadmeProps) => JSX.Element;
declare type StoryPropsProps = {
    children: React.ReactNode;
    title?: React.ReactNode;
};
export declare const StoryProps: ({ title, children }: StoryPropsProps) => JSX.Element;
declare type StorySandboxExampleProps = {
    children: React.ReactNode;
    title?: React.ReactNode;
};
export declare const StorySandboxExample: ({ children, title }: StorySandboxExampleProps) => JSX.Element;
declare type StorySandboxCodeProps = {
    children: React.ReactNode;
};
export declare const StorySandboxCode: ({ children }: StorySandboxCodeProps) => JSX.Element;
export {};
