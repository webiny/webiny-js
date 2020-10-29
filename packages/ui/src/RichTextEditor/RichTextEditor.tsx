import React, { useRef, useEffect } from "react";
import EditorJS, { OutputBlockData } from "@editorjs/editorjs";

type Props = {
    placeholder?: string;
    value: OutputBlockData[];
    onChange: (data: OutputBlockData[]) => void;
    plugins?: any[];
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
            tools: {
                image: {
                    class: SimpleImage,
                    inlineToolbar: true,
                    config: commonConfig
                }
            }
        });
    }, []);

    return <div ref={elementRef} />;
};

export default RichTextEditor;
