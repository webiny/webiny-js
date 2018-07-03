// @flow
import * as React from "react";
import Remarkable from "react-remarkable";
import hljs from "highlight.js";

type Props = {
    source: React.Node
};

export default class Markdown extends React.Component<Props> {
    render() {
        const options = {
            html: true,
            linkTarget: "_parent",
            langPrefix: "lang-",
            highlight(code, lang) {
                return hljs.highlight(lang, code).value;
            }
        };

        return (
            <div className={"markdown-body"}>
                <Remarkable source={this.props.source} options={options} />
            </div>
        );
    }
}
