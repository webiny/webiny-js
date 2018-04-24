import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css?prefix=CodeEditor";

class CodeEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.delayedOnChange = null;
        this.codeMirror = null;
        this.options = {
            lineNumbers: true,
            htmlMode: true,
            mode: props.mode, // needs to be built into CodeMirror vendor
            theme: props.theme, // needs to be built into CodeMirror vendor
            readOnly: props.readOnly
        };

        this.textarea = null;
        this.getTextareaElement = this.getTextareaElement.bind(this);
        this.setValue = this.setValue.bind(this);
    }

    componentDidMount() {
        this.codeMirror = this.props.CodeMirror.fromTextArea(
            this.getTextareaElement(),
            this.options
        );

        this.codeMirror.on("change", () => {
            clearTimeout(this.delayedOnChange);
            this.delayedOnChange = setTimeout(() => {
                this.props.onChange(this.codeMirror.getValue());
            }, this.props.delay);
        });

        this.codeMirror.on("focus", () => {
            this.props.onFocus();
        });

        if (this.props.height !== null) {
            this.codeMirror.setSize(null, this.props.height);
        }

        this.setValue(this.props);
    }

    componentWillReceiveProps(props) {
        this.setValue(props);

        const checkProps = ["mode", "readOnly"];
        _.each(checkProps, prop => {
            if (this.props[prop] !== props[prop]) {
                this.codeMirror.setOption(prop, props[prop]);
            }
        });
    }

    shouldComponentUpdate(props, state) {
        return !_.isEqual(state, this.state);
    }

    setValue(props) {
        if (this.codeMirror.getValue() !== props.value && !_.isNull(props.value)) {
            // the "+ ''" sort a strange with splitLines method within CodeMirror
            this.codeMirror.setValue(props.value + "");
            if (this.props.autoFormat) {
                this.autoFormat();
            }
        }
    }

    getTextareaElement() {
        return this.textarea;
    }

    autoFormat() {
        let totalLines = this.codeMirror.lineCount();
        this.codeMirror.autoFormatRange({ line: 0, ch: 0 }, { line: totalLines });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const props = _.pick(this.props, [
            "value",
            "onChange",
            "onFocus",
            "theme",
            "mode",
            "readOnly"
        ]);

        _.assign(props, {
            ref: editor => (this.editor = editor),
            onBlur: this.props.validate,
            className: "inputGroup",
            placeholder: this.props.placeholder
        });

        const { styles, modules: { FormGroup } } = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={classSet(this.props.className)}>
                {this.props.renderLabel.call(this)}
                <div className={styles.wrapper}>
                    <textarea ref={ref => (this.textarea = ref)} />
                </div>
                <div>
                    {this.props.renderDescription.call(this)}
                    {this.props.renderValidationMessage.call(this)}
                </div>
            </FormGroup>
        );
    }
}

CodeEditor.defaultProps = {
    delay: 400,
    mode: "text/html",
    theme: "monokai",
    readOnly: false, // set 'nocursor' to disable cursor
    onFocus: _.noop,
    value: null,
    onChange: _.noop,
    height: null,
    autoFormat: false
};

export default createComponent([CodeEditor, FormComponent], {
    styles,
    modules: ["FormGroup", { CodeMirror: "Vendor.CodeMirror" }]
});
