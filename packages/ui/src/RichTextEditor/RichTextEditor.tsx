import React, { useRef, useEffect } from "react";
import EditorJS, {
    OutputData,
    OutputBlockData,
    ToolSettings,
    SanitizerConfig,
    LogLevels
} from "@editorjs/editorjs";

export type OnReadyParams = { editor: EditorJS; initialData: OutputData };

export type RichTextEditorProps = {
    autofocus?: boolean;
    context?: { [key: string]: any };
    logLevel?: LogLevels;
    minHeight?: number;
    onChange: (data: OutputBlockData[]) => void;
    onReady?: (params: OnReadyParams) => void;
    placeholder?: string;
    readOnly?: boolean;
    sanitizer?: SanitizerConfig;
    tools?: { [toolName: string]: ToolSettings };
    value: OutputBlockData[];
};

export const RichTextEditor = (props: RichTextEditorProps) => {
    const elementRef = useRef();
    const editorRef = useRef<EditorJS>();

    useEffect(() => {
        const { value, context, onReady, ...nativeProps } = props;
        const initialData = value ? { blocks: value } : { blocks: [] };

        editorRef.current = new EditorJS({
            ...nativeProps,
            holder: elementRef.current,
            data: initialData,
            onChange: async () => {
                const { blocks: data } = await editorRef.current.save();
                props.onChange(data);
            },
            onReady() {
                if (typeof onReady === "function") {
                    onReady({ editor: editorRef.current, initialData });
                }
            },
            tools: Object.keys(props.tools).reduce((tools, name) => {
                const tool = props.tools[name];
                tools[name] = tool;
                if (!tool.config) {
                    tool.config = { context };
                } else {
                    tool.config = { ...tool.config, context };
                }
                return tools;
            }, {})
        });
    }, []);

    return <div ref={elementRef} />;
};
