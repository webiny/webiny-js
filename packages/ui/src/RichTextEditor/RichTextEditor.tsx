import React, { Fragment, useEffect, useRef } from "react";
import shortid from "shortid";
import EditorJS from "@editorjs/editorjs";
import {
    LogLevels,
    OutputBlockData,
    OutputData,
    SanitizerConfig,
    ToolSettings
} from "@editorjs/editorjs/types";
import { FormElementMessage } from "../FormElementMessage";
import { css } from "emotion";
import classNames from "classnames";

const classes = {
    wrapper: css({
        backgroundColor: "var(--mdc-theme-background)",
        padding: "20px 16px 6px"
    }),
    label: css({
        marginBottom: "10px !important"
    }),
    disable: css({
        opacity: 0.7,
        pointerEvents: "none"
    })
};

type EditorJSType = {
    destroy?: () => void;
    save: () => Promise<any>;
};

export type OnReadyParams = { editor: any; initialData: OutputData };

export type RichTextEditorProps = {
    autofocus?: boolean;
    context?: { [key: string]: any };
    logLevel?: string;
    minHeight?: number;
    onChange?: (data: OutputBlockData[]) => void;
    onReady?: (params: OnReadyParams) => void;
    placeholder?: string;
    readOnly?: boolean;
    sanitizer?: SanitizerConfig;
    tools?: { [toolName: string]: ToolSettings };
    value?: OutputBlockData[];
    label?: string;
    description?: string;
    disabled?: boolean;
};

export const RichTextEditor = (props: RichTextEditorProps) => {
    const elementId = useRef("rte-" + shortid.generate());
    const editorRef = useRef<EditorJSType>();

    useEffect(() => {
        const { value, context, onReady, ...nativeProps } = props;
        const initialData = value ? { blocks: value } : { blocks: [] };

        editorRef.current = new EditorJS({
            ...nativeProps,
            holder: elementId.current,
            logLevel: "ERROR" as LogLevels.ERROR,
            data: initialData,
            onChange: async () => {
                const { blocks: data } = await editorRef.current.save();
                props.onChange(data);
            },
            onReady() {
                if (typeof onReady !== "function") {
                    return;
                }
                onReady({ editor: editorRef.current, initialData });
            },
            tools: Object.keys(props.tools || {}).reduce((tools, name) => {
                const tool = props.tools[name];
                tools[name] = tool;
                if (!tool.config) {
                    tool.config = { context };
                } else if (typeof tool.config === "function") {
                    tool.config = tool.config();
                } else {
                    tool.config = { ...tool.config, context };
                }
                return tools;
            }, {})
        });

        return () => {
            if (!editorRef.current || typeof editorRef.current.destroy !== "function") {
                return;
            }

            editorRef.current.destroy();
        };
    }, []);

    const { label, description, disabled } = props;

    return (
        <Fragment>
            <div className={classNames(classes.wrapper, { [classes.disable]: disabled })}>
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
                <div id={elementId.current} />
            </div>
            {description && <FormElementMessage>{description}</FormElementMessage>}
        </Fragment>
    );
};
