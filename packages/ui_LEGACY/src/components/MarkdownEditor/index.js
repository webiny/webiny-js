import React from "react";
import _ from "lodash";
import { inject } from "webiny-app";
import { withFormComponent } from "webiny-ui";
import SimpleMDE from "simplemde";
import styles from "./styles.module.scss";

@withFormComponent()
@inject({ styles })
class MarkdownEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState
        };

        this.mdEditor = null;
        this.options = null;
        this.textarea = null;

        ["getTextareaElement", "setValue", "getEditor", "getHtml"].map(
            m => (this[m] = this[m].bind(this))
        );
    }

    componentDidMount() {
        const mdConfig = {
            autoDownloadFontAwesome: false,
            element: this.getTextareaElement(),
            renderingConfig: {
                codeSyntaxHighlighting: true
            },
            hideIcons: ["side-by-side", "fullscreen"],
            indentWithTabs: true,
            tabSize: 4
        };

        this.mdEditor = new SimpleMDE(mdConfig);

        this.mdEditor.codemirror.on("change", () => {
            this.props.onChange(this.mdEditor.codemirror.getValue());
        });

        // Store original previewRenderer
        this.originalRenderer = this.mdEditor.options.previewRender.bind(this.mdEditor.options);

        // Set new renderer that will use the original renderer first, then apply custom renderers
        this.mdEditor.options.previewRender = plainText => {
            let html = this.originalRenderer(plainText);
            _.each(this.props.customParsers, p => (html = p(html)));
            return html;
        };
    }

    componentWillReceiveProps(props) {
        if (this.mdEditor.codemirror.getValue() !== props.value && !_.isNull(props.value)) {
            // the "+ ''" sort a strange with splitLines method within CodeMirror
            this.mdEditor.codemirror.setValue(props.value + "");
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    setValue(value) {
        this.mdEditor.codemirror.setValue(value);
    }

    getEditor() {
        return this.mdEditor;
    }

    getTextareaElement() {
        return this.textarea;
    }

    getHtml() {
        return this.mdEditor.options.previewRender(this.mdEditor.codemirror.getValue());
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <div className="smde">
                <textarea ref={ref => (this.textarea = ref)} />
            </div>
        );
    }
}

MarkdownEditor.defaultProps = {
    onChange: _.noop,
    customParsers: []
};

export default MarkdownEditor;
