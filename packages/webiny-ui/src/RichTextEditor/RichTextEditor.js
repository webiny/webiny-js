// @flow
import React from "react";
import { get } from "lodash";
import { Editor } from "slate-react";
import { Value } from "slate";
import styled from "react-emotion";
import getInitialValue from "./getInitialValue";
import Menu from "./Menu";
import shortid from "shortid";
import { FormElementMessage } from "webiny-ui/FormElementMessage";
import { css } from "emotion";
import classNames from "classnames";
import type { FormComponentProps } from "./../types";

const EditorWrapper = styled("div")({
    border: "1px solid var(--mdc-theme-on-background)",
    borderRadius: 2,
    boxSizing: "border-box",
    padding: 10
});

const EditorContent = styled("div")({
    "> div > div": {
        boxSizing: "border-box",
        padding: 10,
        maxHeight: 500,
        minHeight: 200,
        overflow: "scroll"
    }
});

const classes = {
    label: css({
        marginBottom: "10px !important"
    }),
    disable: css({
        opacity: 0.7,
        pointerEvents: "none"
    })
};

type Props = FormComponentProps & {
    disabled: ?boolean,
    description: ?string,
    label: ?string,
    menuPlugins: Array<Object>,
    editorPlugins: Array<Object>
};

type State = {
    modified: boolean,
    showMenu: boolean,
    value: Object,
    readOnly: boolean,
    activePlugin: ?Object
};

class RichTextEditor extends React.Component<Props, State> {
    static defaultProps = {};

    editor = React.createRef();

    id: string;
    constructor(props: Props) {
        super();
        this.id = shortid.generate();

        this.state = {
            modified: false,
            showMenu: false,
            value: props.value ? Value.fromJSON(props.value) : Value.create(getInitialValue()),
            readOnly: !props.onChange,
            activePlugin: null
        };
    }

    static getDerivedStateFromProps(props: Object, state: Object) {
        if (!state.modified && !props.readOnly) {
            // Got new editor value through props.
            return {
                value: props.value ? Value.fromJSON(props.value) : Value.create(getInitialValue())
            };
        }

        return null;
    }

    componentDidMount() {
        // $FlowFixMe
        document.getElementById(this.id).addEventListener("mousedown", this.trackNextElement);
        // $FlowFixMe
        document.getElementById(this.id).addEventListener("mouseup", this.untrackNextElement);
    }

    componentWillUnmount() {
        // $FlowFixMe
        document.getElementById(this.id).removeEventListener("mousedown", this.trackNextElement);
        // $FlowFixMe
        document.getElementById(this.id).removeEventListener("mouseup", this.untrackNextElement);
    }

    onChange = (change: Object) => {
        // Prevent `onChange` if it is a `set_value` operation.
        // We only need to handle changes on user input.
        if (get(change.operations.toJSON(), "0.type") === "set_value") {
            return;
        }

        // Only update local state.
        this.setState(state => ({
            ...state,
            value: change.value,
            modified: true
        }));
    };

    onBlur = () => {
        // if (!this.nextElement) {
        this.setState({ modified: false });
        const { onChange } = this.props;
        typeof onChange === "function" && onChange(this.state.value.toJSON());
        // }
    };

    activatePlugin = (plugin: string) => {
        const { value } = this.state;

        this.setState({
            activePlugin: {
                plugin,
                value: {
                    selection: value.selection.toJSON(),
                    anchorText: value.anchorText.getText(),
                    focusText: value.focusText.getText(),
                    inlines: value.inlines.toJSON(),
                    marks: value.marks.toJSON(),
                    activeMarks: value.activeMarks.toJSON(),
                    blocks: value.blocks.toJSON(),
                    texts: value.texts.toJSON()
                }
            }
        });
    };

    deactivatePlugin = () => {
        this.setState({ activePlugin: null });
    };

    render() {
        const { label, disabled, description, validation = { isValid: null } } = this.props;

        return (
            <div className={classNames({ [classes.disable]: disabled })}>
                {label && (
                    <div
                        className={classNames(
                            "mdc-text-field-helper-text mdc-text-field-helper-text--persistent",
                            classes.label
                        )}
                    >
                        {label}
                    </div>
                )}
                <EditorWrapper id={this.id}>
                    <Menu
                        menuPlugins={this.props.menuPlugins}
                        value={this.state.value}
                        onChange={this.onChange}
                        editor={this.editor.current}
                        activePlugin={this.state.activePlugin}
                        activatePlugin={this.activatePlugin}
                        deactivatePlugin={this.deactivatePlugin}
                    />
                    <EditorContent>
                        <Editor
                            onBlur={this.onBlur}
                            ref={this.editor}
                            autoCorrect={false}
                            spellCheck={false}
                            plugins={this.props.editorPlugins}
                            placeholder="Enter some text..."
                            value={this.state.value}
                            onChange={this.onChange}
                            activatePlugin={this.activatePlugin}
                            activePlugin={this.state.activePlugin}
                            deactivatePlugin={this.deactivatePlugin}
                        />
                    </EditorContent>
                </EditorWrapper>
                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </div>
        );
    }
}

export default RichTextEditor;
