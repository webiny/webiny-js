import * as React from "react";
import { Editable, withReact, Slate } from "slate-react";
import { Editor as SlateEditor, createEditor } from "slate";
import { withHistory } from "slate-history";
import styled from "@emotion/styled";
import { css } from "emotion";
import classNames from "classnames";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { MenuButton } from "./index";
import { Menu } from "./Menu";
import { FormComponentProps } from "@webiny/ui/types";
import { pluginsToProps } from "./pluginsToProps";

const EditorWrapper = styled("div")({
    border: "1px solid var(--mdc-theme-on-background)",
    borderRadius: 2,
    boxSizing: "border-box",
    padding: 10
});

const EditorContent = styled("div")({
    height: 250,
    minHeight: 200,
    overflow: "auto",
    resize: "vertical",
    padding: "0px 8px",
    /*
     * Increases the height of Slate editor's "content editable" area,
     * so that when a user clicks on it, it's always focused properly.
     * https://github.com/webiny/webiny-js/issues/1013
     * */
    "& > div": {
        height: "90%"
    },

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

export type Editor = SlateEditor & {
    hasMark?(mark: string): boolean;
    toggleMark?(mark: string): void;
};

export type EditorPlugin = { [key: string]: any };

interface MenuPluginRender {
    MenuButton: typeof MenuButton;
    editor: Editor;
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
    placeholder?: string;
    label?: string;
    plugins?: RichTextEditorPlugin[];
};

type State = {
    showMenu: boolean;
    value: any;
    readOnly: boolean;
    activePlugin?: { [key: string]: any };
};

const initialValue = [{ type: "paragraph", children: [{ text: "" }] }];

const withUtils = (editor: Editor) => {
    const { isInline } = editor;

    editor.hasMark = mark => {
        const marks = SlateEditor.marks(editor);
        return marks ? marks[mark] === true : false;
    };

    editor.toggleMark = mark => {
        const isActive = editor.hasMark(mark);

        if (isActive) {
            SlateEditor.removeMark(editor, mark);
        } else {
            SlateEditor.addMark(editor, mark, true);
        }
    };

    // TODO: add `enhanceEditor` method to editor plugins and move this to `link` plugin
    editor.isInline = element => {
        return element.type === "link" ? true : isInline(element);
    };

    return editor;
};

export class RichTextEditor extends React.Component<RichTextEditorProps, State> {
    static defaultProps = {
        validation: { isValid: null }
    };

    plugins: { editor: Object[]; menu: Object[] };
    editor?: Editor;
    editorProps: any;

    constructor(props: RichTextEditorProps) {
        super(props);

        this.state = {
            showMenu: false,
            value: props.value || initialValue,
            readOnly: !props.onChange,
            activePlugin: null
        };

        this.editor = withUtils(withHistory(withReact(createEditor())));
        this.editorProps = pluginsToProps(props.plugins, {
            editor: this.editor,
            activatePlugin: this.activatePlugin
        });
    }

    static getDerivedStateFromProps(props: RichTextEditorProps) {
        if (!props.readOnly) {
            // Got new editor value through props.
            return {
                value: props.value ? props.value : initialValue
            };
        }

        return null;
    }

    onChange = (value: any) => {
        this.setState(state => ({
            ...state,
            value
        }));

        const { onChange } = this.props;
        typeof onChange === "function" && onChange(value);
    };

    activatePlugin = (plugin: string) => {
        this.setState({
            activePlugin: {
                plugin,
                selection: this.editor.selection,
                fragment: this.editor.getFragment()
            }
        });
    };

    deactivatePlugin = () => {
        this.setState({ activePlugin: null });
    };

    render() {
        const { plugins, label, disabled, description, validation, placeholder } = this.props;
        const { renderEditor, ...editorProps } = this.editorProps;

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
                <EditorWrapper>
                    <Slate
                        editor={this.editor as any}
                        value={this.state.value}
                        onChange={this.onChange}
                    >
                        <Menu
                            plugins={plugins}
                            activePlugin={this.state.activePlugin}
                            activatePlugin={this.activatePlugin}
                            deactivatePlugin={this.deactivatePlugin}
                        />
                        <EditorContent>
                            {renderEditor(
                                <Editable
                                    readOnly={disabled}
                                    placeholder={placeholder}
                                    spellCheck
                                    autoFocus
                                    {...editorProps}
                                />
                            )}
                        </EditorContent>
                    </Slate>
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

/*<EditorContent>
    {React.createElement<any>(SlateEditor, {
        onBlur: this.onBlur,
        ref: this.setEditorRef,
        autoCorrect: false,
        spellCheck: false,
        plugins: this.plugins.editor,
        placeholder: placeholder || "Enter some text...",
        value: this.state.value,
        onChange: this.onChange,
        activatePlugin: this.activatePlugin,
        activePlugin: this.state.activePlugin,
        deactivatePlugin: this.deactivatePlugin
    })}
</EditorContent>*/

/*<Menu
    plugins={plugins}
    value={this.state.value}
    onChange={this.onChange}
    activePlugin={this.state.activePlugin}
    activatePlugin={this.activatePlugin}
    deactivatePlugin={this.deactivatePlugin}
/>*/
