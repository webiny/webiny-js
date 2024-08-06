import React, { Fragment, useEffect, useRef } from "react";
import shortid from "shortid";
import EditorJS, {
    LogLevels,
    OutputBlockData,
    OutputData,
    SanitizerConfig,
    ToolSettings
} from "@editorjs/editorjs";
import { FormElementMessage } from "~/FormElementMessage";
import { css } from "emotion";
import classNames from "classnames";
import { FormComponentProps } from "@webiny/form";

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

interface EditorJSType {
    destroy?: () => void;
    save: () => Promise<any>;
}

export interface OnReadyParams {
    editor: any;
    initialData: OutputData;
}

export type RichTextEditorValue = OutputBlockData[];

export interface RichTextEditorProps {
    autofocus?: boolean;
    className?: string;
    context?: { [key: string]: any };
    description?: string;
    disabled?: boolean;
    label?: string;
    logLevel?: string;
    minHeight?: number;
    onChange?: (data: RichTextEditorValue) => void;
    onReady?: (params: OnReadyParams) => void;
    placeholder?: string;
    readOnly?: boolean;
    sanitizer?: SanitizerConfig;
    tools?: {
        [toolName: string]: ToolSettings;
    };
    validation?: FormComponentProps["validation"];
    value?: RichTextEditorValue;
}

const waitForDom = (id: string, callback: () => void) => {
    let timeSpent = 0;
    const interval = setInterval(() => {
        if (timeSpent > 1000) {
            clearInterval(interval);
            return;
        }

        const dom = document.querySelector(`#${id}`);
        if (!dom) {
            timeSpent += 10;
            return;
        }

        clearInterval(interval);
        callback();
    }, 10);

    return () => {
        clearInterval(interval);
    };
};

export const RichTextEditor = (props: RichTextEditorProps) => {
    const elementId = useRef("rte-" + shortid.generate());
    const editorRef = useRef<EditorJSType>();

    useEffect(() => {
        const { value, context, onReady, ...nativeProps } = props;

        const initialData = value ? { blocks: value } : { blocks: [] };

        const clearWait = waitForDom(elementId.current, () => {
            editorRef.current = new EditorJS({
                ...nativeProps,
                holder: elementId.current,
                logLevel: "ERROR" as LogLevels.ERROR,
                data: initialData,
                onChange: async () => {
                    if (!editorRef.current) {
                        return;
                    }
                    const { blocks: data } = await editorRef.current.save();
                    if (!props.onChange) {
                        return;
                    }
                    props.onChange(data);
                },
                onReady() {
                    if (typeof onReady !== "function") {
                        return;
                    }
                    onReady({ editor: editorRef.current, initialData });
                },
                tools: Object.keys(props.tools || {}).reduce(
                    (tools, name) => {
                        const tool = props.tools ? props.tools[name] : null;
                        if (!tool) {
                            return tools;
                        }
                        tools[name] = tool;
                        if (!tool.config) {
                            tool.config = { context };
                        } else if (typeof tool.config === "function") {
                            tool.config = tool.config();
                        } else {
                            tool.config = { ...tool.config, context };
                        }
                        return tools;
                    },
                    {} as Record<string, ToolSettings>
                )
            });
        });

        return () => {
            clearWait();
            if (!editorRef.current || typeof editorRef.current.destroy !== "function") {
                return;
            }

            editorRef.current.destroy();
        };
    }, []);

    const { label, description, disabled, validation, className } = props;

    return (
        <Fragment>
            <div
                className={classNames(classes.wrapper, className, { [classes.disable]: disabled })}
            >
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
            {validation && validation.isValid === false && (
                <FormElementMessage error>{validation.message}</FormElementMessage>
            )}
            {validation && validation.isValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </Fragment>
    );
};
