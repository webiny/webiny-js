// @flow
import * as React from "react";
import Highlight from "react-highlight.js";
import copy from "copy-to-clipboard";
import elementToString from "react-element-to-jsx-string";
import prettier from "prettier/standalone";
import babylon from "prettier/parser-babylon";

type Props = {
    copy?: boolean,
    lang?: string,
    children?: React.Node
};

type State = {
    copied: boolean
};

class CodeBlock extends React.Component<Props, State> {
    state = { copied: false };

    copy = (source: React.Node) => {
        copy(source);
        this.setState({ copied: true }, () => {
            setTimeout(() => {
                this.setState({ copied: false });
            }, 2000);
        });
    };

    render() {
        let { children: source } = this.props;
        if (typeof source === "object") {
            // $FlowFixMe
            source = elementToString(source, { showDefaultProps: false, showFunctions: true });
        } else {
            source = String(source);
        }

        return (
            <div>
                {this.props.copy && (
                    <a href={"javascript:void(0)"} onClick={() => this.copy(source)}>
                        {this.state.copied ? "Copied!" : "Copy to clipboard"}
                    </a>
                )}
                <Highlight language={this.props.lang || "html"}>
                    {prettier
                        .format(source, { parser: "babylon", plugins: [babylon] })
                        .replace(">;", ">")}
                </Highlight>
            </div>
        );
    }
}

export default CodeBlock;
