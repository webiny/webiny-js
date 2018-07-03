// @flow
import * as React from "react";
import CodeBlock from "../CodeBlock";
import Markdown from "../Markdown";

class Story extends React.Component<Object> {
    static Readme = ({ children }: { children: React.Node }) => <Markdown source={children} />;

    static Props = ({ children }: { children: React.Node }) => (
        <React.Fragment>
            <h2>Props</h2>
            <CodeBlock lang={"js"}>{children}</CodeBlock>
        </React.Fragment>
    );

    static Sandbox = (props: Object) => {
        const children = React.Children.toArray(props.children);
        if (children.length === 2) {
            return <div style={{ display: "flex" }}>{props.children}</div>;
        }

        return (
            <div style={{ display: "flex" }}>
                <Story.Sandbox.Example title={props.title}>{props.children}</Story.Sandbox.Example>
                <Story.Sandbox.Code>{props.children}</Story.Sandbox.Code>
            </div>
        );
    };

    render() {
        return (
            <div className={"markdown-body"} style={{ padding: "0 20px" }}>
                {this.props.children}
            </div>
        );
    }
}

// eslint-disable-next-line
Story.Sandbox.Example = ({ children, title = "Example" }) => (
    <div style={{ width: "50%", marginRight: 15 }}>
        <h2>{title}</h2>
        {children}
    </div>
);

Story.Sandbox.Example.displayName = "Story.Sandbox.Example";

// eslint-disable-next-line
Story.Sandbox.Code = ({ children }) => (
    <div style={{ width: "50%" }}>
        <h2>Code</h2>
        <CodeBlock copy={true}>{children}</CodeBlock>
    </div>
);

Story.Sandbox.Code.displayName = "Story.Sandbox.Code";

export default Story;
