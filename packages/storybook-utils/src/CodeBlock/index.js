// @flow
import * as React from "react";
import Highlight from "react-highlight.js";
import copy from "copy-to-clipboard";
import elementToString from "react-element-to-jsx-string";
import prettier from "prettier/standalone";
import babylon from "prettier/parser-babylon";
import styled from "@emotion/styled";

type Props = {
    copy?: boolean,
    lang?: string,
    children?: React.Node
};

type State = {
    copied: boolean
};

const CopyToClipboard = styled("div")({
    position: "relative",
    fontSize: 13,
    ".container": {
        position: "absolute",
        top: 18,
        right: 18
    },
    ".copy": {
        cursor: "pointer",
        ":hover": {
            opacity: 0.75
        }
    },
    ".success": {
        color: "green"
    }
});

class CodeBlock extends React.Component<Props, State> {
    state = { copied: false };

    copy = (source: React.Node) => {
        copy(source);
        this.setState({ copied: true }, () => {
            setTimeout(() => {
                this.setState({ copied: false });
            }, 1500);
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
            <React.Fragment>
                <CopyToClipboard>
                    {this.props.copy && (
                        <div onClick={() => this.copy(source)} className="container">
                            {this.state.copied ? (
                                <span className="success">Copied!</span>
                            ) : (
                                <span className="copy">Copy</span>
                            )}
                        </div>
                    )}
                </CopyToClipboard>

                <Highlight language={this.props.lang || "html"}>
                    {prettier
                        .format(source, { parser: "babylon", plugins: [babylon] })
                        .replace(">;", ">")}
                </Highlight>
            </React.Fragment>
        );
    }
}

export default CodeBlock;
