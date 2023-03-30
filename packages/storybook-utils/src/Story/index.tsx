import React from "react";
import CodeBlock from "../CodeBlock";
import Markdown from "../Markdown";

export class Story extends React.Component<{ children: React.ReactNode }> {
    public override render(): React.ReactNode {
        return (
            <div className={"markdown-body"} style={{ padding: "0 20px" }}>
                {this.props.children}
            </div>
        );
    }
}

interface StorySandboxProps {
    title?: React.ReactNode;
    children: React.ReactNode;
}

export const StorySandbox: React.VFC<StorySandboxProps> = props => {
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

export const StoryReadme: React.VFC<{ children: React.ReactNode }> = ({ children }) => (
    <Markdown source={children} />
);

interface StoryPropsProps {
    title?: React.ReactNode;
    children: React.ReactNode;
}

export const StoryProps: React.VFC<StoryPropsProps> = ({ title, children }) => (
    <React.Fragment>
        <h3>{title || "Props"}</h3>
        <CodeBlock lang={"js"}>{children}</CodeBlock>
    </React.Fragment>
);

interface StorySandboxExampleProps {
    title?: React.ReactNode;
    children: React.ReactNode;
}

export const StorySandboxExample: React.VFC<StorySandboxExampleProps> = ({ children, title }) => (
    <div style={{ width: "50%", marginRight: 15 }}>
        <h2>{title || "Example"}</h2>
        {children}
    </div>
);

export const StorySandboxCode: React.VFC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ width: "50%" }}>
        <h2>Code</h2>
        <CodeBlock copy={true}>{children}</CodeBlock>
    </div>
);
