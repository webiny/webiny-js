import React, { useRef, useEffect } from "react";
import EditorJS, { OutputBlockData, ToolSettings } from "@editorjs/editorjs";

type Props = {
    placeholder?: string;
    value: OutputBlockData[];
    onChange: (data: OutputBlockData[]) => void;
    tools: { [toolName: string]: ToolSettings };
    showFileManager?: Function;
};

const RichTextEditor = (props: Props) => {
    const elementRef = useRef();
    const editorRef = useRef<EditorJS>();

    useEffect(() => {
        const commonConfig = {
            showFileManager: props.showFileManager
        };

        editorRef.current = new EditorJS({
            holder: elementRef.current,
            data: props.value ? { blocks: props.value } : { blocks: [] },
            placeholder: props.placeholder,
            onChange: async () => {
                const { blocks: data } = await editorRef.current.save();
                props.onChange(data);
            },
            tools: Object.keys(props.tools).reduce((tools, name) => {
                const tool = props.tools[name];
                tools[name] = tool;
                if (!tool.config) {
                    tool.config = commonConfig;
                } else {
                    tool.config = { ...tool.config, ...commonConfig };
                }
                return tools;
            }, {})
        });
    }, []);

    return <div ref={elementRef} />;
};

export default RichTextEditor;
