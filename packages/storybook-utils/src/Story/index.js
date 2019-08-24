// @flow
import * as React from "react";
import CodeBlock from "../CodeBlock";
import Markdown from "../Markdown";

export class Story extends React.Component<{ children: React.Node }> {
    render() {
        return (
            <div className={"markdown-body"} style={{ padding: "0 20px" }}>
                {this.props.children}
            </div>
        );
    }
}

type StorySandboxProps = {
    children: React.Node,
    title?: React.Node
};

export const StorySandbox = (props: StorySandboxProps) => {
    const children = React.Children.toArray(props.children);
    if (children.length === 2) {
        return <div style={{ display: "flex" }}>{props.children}</div>;
    }

    return (
        <div style={{ display: "flex" }}>
            <StorySandboxExample title={props.title}>{props.children}</StorySandboxExample>
            <StorySandboxCode>{props.children}</StorySandboxCode>
        </div>
    );
};

type StoryReadmeProps = {
    children: React.Node
};

export const StoryReadme = ({ children }: StoryReadmeProps) => <Markdown source={children} />;

type StoryPropsProps = {
    children: React.Node,
    title?: React.Node
};

export const StoryProps = ({ title, children }: StoryPropsProps) => (
    <React.Fragment>
        <h3>{title || "Props"}</h3>
        <CodeBlock lang={"js"}>{children}</CodeBlock>
    </React.Fragment>
);

type StorySandboxExampleProps = {
    children: React.Node,
    title?: React.Node
};

export const StorySandboxExample = ({ children, title }: StorySandboxExampleProps) => (
    <div style={{ width: "50%", marginRight: 15 }}>
        <h2>{title || "Example"}</h2>
        {children}
    </div>
);

type StorySandboxCodeProps = {
    children: React.Node
};

export const StorySandboxCode = ({ children }: StorySandboxCodeProps) => (
    <div style={{ width: "50%" }}>
        <h2>Code</h2>
        <CodeBlock copy={true}>{children}</CodeBlock>
    </div>
);
