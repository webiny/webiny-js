import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import SimpleMDE from 'simplemde';
import styles from './styles.scss';

class MarkdownEditor extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);

        this.mdEditor = null;
        this.options = null;

        this.bindMethods('getTextareaElement', 'setValue', 'getEditor', 'getHtml');
    }

    componentDidMount() {
        super.componentDidMount();

        const mdConfig = {
            autoDownloadFontAwesome: false,
            element: this.getTextareaElement(),
            renderingConfig: {
                codeSyntaxHighlighting: true
            },
            hideIcons: ['side-by-side', 'fullscreen'],
            indentWithTabs: true,
            tabSize: 4
        };

        this.mdEditor = new SimpleMDE(mdConfig);
        window.sme = this.mdEditor;

        this.mdEditor.codemirror.on('change', () => {
            this.props.onChange(this.mdEditor.codemirror.getValue());
        });

        // Store original previewRenderer
        this.originalRenderer = this.mdEditor.options.previewRender.bind(this.mdEditor.options);

        // Set new renderer that will use the original renderer first, then apply custom renderers
        this.mdEditor.options.previewRender = plainText => {
            let html = this.originalRenderer(plainText);
            _.each(this.props.customParsers, p => html = p(html));
            return html;
        };
    }

    componentWillReceiveProps(props) {
        if (this.mdEditor.codemirror.getValue() !== props.value && !_.isNull(props.value)) {
            // the "+ ''" sort a strange with splitLines method within CodeMirror
            this.mdEditor.codemirror.setValue(props.value + '');
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
        return ReactDOM.findDOMNode(this).querySelector('textarea');
    }

    getHtml() {
        return this.mdEditor.options.previewRender(this.mdEditor.codemirror.getValue());
    }
}

MarkdownEditor.defaultProps = {
    onChange: _.noop,
    customParsers: [],
    renderer() {
        return (
            <div className="smde">
                <textarea/>
            </div>
        );
    }
};

export default Webiny.createComponent(MarkdownEditor, {styles});
