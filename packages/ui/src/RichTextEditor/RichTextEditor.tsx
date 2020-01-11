import * as React from "react";
import { get } from "lodash";
import { Editor as SlateEditor } from "slate-react";
import { Value, Editor } from "slate";
import Plain from "slate-plain-serializer";
import styled from "@emotion/styled";
import { css } from "emotion";
import classNames from "classnames";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { MenuButton } from "@webiny/ui/RichTextEditor";
import { Menu } from "./Menu";
import shortid from "shortid"; // TODO: remove this one
import { FormComponentProps } from "./../types";

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
        overflow: "scroll",
        color: "var(--mdc-theme-on-surface)"
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

export type EditorPlugin = { [key: string]: any };

interface MenuPluginRender {
    MenuButton: typeof MenuButton;
    editor: Editor;
    onChange: () => void;
    activatePlugin(name: string): void;
}

export type MenuPlugin = {
    render: (params: MenuPluginRender) => React.ReactNode;
    renderDialog?: (params: any) => React.ReactNode;
};

export type RichTextEditorPlugin = {
    name: string;
    editor?: EditorPlugin;
    menu?: MenuPlugin;
};

export type RichTextEditorProps = FormComponentProps & {
    disabled?: boolean;
    readOnly?: boolean;
    description?: string;
    label?: string;
    plugins?: RichTextEditorPlugin[];
};

type State = {
    ts?: number;
    modified: boolean;
    showMenu: boolean;
    value: any;
    readOnly: boolean;
    activePlugin?: { [key: string]: any };
};

export class RichTextEditor extends React.Component<RichTextEditorProps, State> {
    static defaultProps = {
        validation: { isValid: null }
    };

    id: string;
    plugins: { editor: Array<Object> };
    nextElement?: EventTarget;
    editor?: Editor;

    constructor(props: RichTextEditorProps) {
        super(props);
        this.id = shortid.generate();
        this.nextElement = null;

        this.state = {
            modified: false,
            showMenu: false,
            value: props.value ? Value.fromJSON(props.value) : Plain.deserialize(""),
            readOnly: !props.onChange,
            activePlugin: null
        };

        this.plugins = {
            editor: props.plugins.map(plugin => plugin.editor).filter(Boolean)
        };
    }

    static getDerivedStateFromProps(props: RichTextEditorProps, state: State) {
        if (!state.modified && !props.readOnly) {
            // Got new editor value through props.
            return {
                value: props.value ? Value.fromJSON(props.value) : Plain.deserialize("")
            };
        }

        return null;
    }

    componentDidMount() {
        document.getElementById(this.id).addEventListener("mousedown", this.trackNextElement);
        document.getElementById(this.id).addEventListener("mouseup", this.untrackNextElement);
    }

    componentWillUnmount() {
        document.getElementById(this.id).removeEventListener("mousedown", this.trackNextElement);
        document.getElementById(this.id).removeEventListener("mouseup", this.untrackNextElement);
    }

    trackNextElement = (e: MouseEvent) => {
        // Store the clicked element. If it is set, it means we clicked inside the editor div.
        this.nextElement = e.target;
    };

    untrackNextElement = () => {
        this.nextElement = null;
    };

    onChange = (change: any) => {
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
        if (!this.nextElement) {
            this.setState({ modified: false });
            const { onChange } = this.props;
            typeof onChange === "function" && onChange(this.state.value.toJSON());
        }
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

    setEditorRef = editor => {
        this.editor = editor;
        this.setState({ ts: new Date().getTime() });
    };

    render() {
        const { plugins, label, disabled, description, validation } = this.props;

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
                        plugins={plugins}
                        value={this.state.value}
                        onChange={this.onChange}
                        editor={this.editor}
                        activePlugin={this.state.activePlugin}
                        activatePlugin={this.activatePlugin}
                        deactivatePlugin={this.deactivatePlugin}
                    />
                    <EditorContent>
                        {React.createElement<any>(SlateEditor, {
                            onBlur: this.onBlur,
                            ref: this.setEditorRef,
                            autoCorrect: false,
                            spellCheck: false,
                            plugins: this.plugins.editor,
                            placeholder: "Enter some text...",
                            value: this.state.value,
                            onChange: this.onChange,
                            activatePlugin: this.activatePlugin,
                            activePlugin: this.state.activePlugin,
                            deactivatePlugin: this.deactivatePlugin
                        })}
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
