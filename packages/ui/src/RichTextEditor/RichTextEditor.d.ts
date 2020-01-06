import * as React from "react";
import { Editor } from "slate";
import { MenuButton } from "@webiny/ui/RichTextEditor";
import { FormComponentProps } from "./../types";
export declare type EditorPlugin = {
    [key: string]: any;
};
interface MenuPluginRender {
    MenuButton: typeof MenuButton;
    editor: Editor;
    onChange: () => void;
    activatePlugin(name: string): void;
}
export declare type MenuPlugin = {
    render: (params: MenuPluginRender) => React.ReactNode;
    renderDialog?: (params: any) => React.ReactNode;
};
export declare type RichTextEditorPlugin = {
    name: string;
    editor?: EditorPlugin;
    menu?: MenuPlugin;
};
export declare type RichTextEditorProps = FormComponentProps & {
    disabled?: boolean;
    readOnly?: boolean;
    description?: string;
    label?: string;
    plugins?: RichTextEditorPlugin[];
};
declare type State = {
    ts?: number;
    modified: boolean;
    showMenu: boolean;
    value: any;
    readOnly: boolean;
    activePlugin?: {
        [key: string]: any;
    };
};
export declare class RichTextEditor extends React.Component<RichTextEditorProps, State> {
    static defaultProps: {
        validation: {
            isValid: any;
        };
    };
    id: string;
    plugins: {
        editor: Array<Object>;
    };
    nextElement?: EventTarget;
    editor?: Editor;
    constructor(props: RichTextEditorProps);
    static getDerivedStateFromProps(props: RichTextEditorProps, state: State): {
        value: any;
    };
    componentDidMount(): void;
    componentWillUnmount(): void;
    trackNextElement: (e: MouseEvent) => void;
    untrackNextElement: () => void;
    onChange: (change: any) => void;
    onBlur: () => void;
    activatePlugin: (plugin: string) => void;
    deactivatePlugin: () => void;
    setEditorRef: (editor: any) => void;
    render(): JSX.Element;
}
export {};
