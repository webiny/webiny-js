import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class CodeEditor extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);

        this.delayedOnChange = null;
        this.codeMirror = null;
        this.options = {
            lineNumbers: true,
            htmlMode: true,
            mode: props.mode, // needs to be built into CodeMirror vendor
            theme: props.theme, // needs to be built into CodeMirror vendor
            readOnly: props.readOnly
        };

        this.bindMethods('getTextareaElement,setValue,focus');
    }

    componentDidMount() {
        super.componentDidMount();

        this.codeMirror = this.props.CodeMirror.fromTextArea(this.getTextareaElement(), this.options);

        this.codeMirror.on('change', () => {
            clearTimeout(this.delayedOnChange);
            this.delayedOnChange = setTimeout(() => {
                this.props.onChange(this.codeMirror.getValue());
            }, this.props.delay);
        });

        this.codeMirror.on('focus', () => {
            this.props.onFocus();
        });

        if (this.props.height !== null) {
            this.codeMirror.setSize(null, this.props.height);
        }

        this.setValue(this.props);
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        this.setValue(props);

        const checkProps = ['mode', 'readOnly'];
        _.each(checkProps, (prop) => {
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
            this.codeMirror.setValue(props.value + '');
            if (this.props.autoFormat) {
                this.autoFormat();
            }
        }
    }

    getTextareaElement() {
        return ReactDOM.findDOMNode(this).querySelector('textarea');
    }

    focus() {
        this.codeMirror.focus();
    }

    autoFormat() {
        let totalLines = this.codeMirror.lineCount();
        this.codeMirror.autoFormatRange({line: 0, ch: 0}, {line: totalLines});
    }
}

CodeEditor.defaultProps = Webiny.Ui.FormComponent.extendProps({
    delay: 400,
    mode: 'text/html',
    theme: 'monokai',
    readOnly: false, // set 'nocursor' to disable cursor
    onFocus: _.noop,
    value: null,
    onChange: _.noop,
    height: null,
    autoFormat: false,
    renderer() {
        const props = _.pick(this.props, ['value', 'onChange', 'onFocus', 'theme', 'mode', 'readOnly']);

        _.assign(props, {
            ref: (editor) => this.editor = editor,
            onBlur: this.validate,
            className: 'inputGroup',
            placeholder: this.getPlaceholder()
        });

        const {styles, FormGroup} = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={this.classSet(this.props.className)}>
                {this.renderLabel()}
                <div className={styles.wrapper}>
                    <textarea/>
                </div>
                <div>
                    {this.renderDescription()}
                    {this.renderValidationMessage()}
                </div>
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(CodeEditor, {
    styles,
    modules: ['FormGroup', {CodeMirror: 'Webiny/Vendors/CodeMirror'}],
    api: ['focus']
});