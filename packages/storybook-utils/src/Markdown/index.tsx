import * as React from "react";
/**
 * Package react-remarkable does not have types.
 */
// @ts-expect-error
import Remarkable from "react-remarkable";
import hljs from "highlight.js";

interface Props {
    source: React.ReactNode;
}

export default class Markdown extends React.Component<Props> {
    public override render(): React.ReactNode {
        const options = {
            html: true,
            linkTarget: "_parent",
            langPrefix: "lang-",
            highlight(code: string, lang: string) {
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
