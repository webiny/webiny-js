import React, { useEffect, useRef } from "react";
import type {
    LogLevels,
    OutputBlockData,
    OutputData,
    SanitizerConfig,
    ToolSettings
} from "@editorjs/editorjs";
import EditorJS from "@editorjs/editorjs";
import { cn, cva, generateId, type VariantProps } from "~/utils.js";

const richTextEditorVariants = cva(
    [
        "wby-min-h-[80px] wby-w-full wby-border-sm wby-text-md focus-visible:wby-outline-none disabled:wby-cursor-not-allowed"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "wby-bg-neutral-base wby-border-neutral-muted wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-border-neutral-strong",
                    "focus:wby-border-neutral-black"
                ],
                secondary: [
                    "wby-bg-neutral-light wby-border-neutral-subtle wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dimmed",
                    "focus:wby-bg-neutral-base focus:wby-border-neutral-black"
                ],
                ghost: [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dark/5",
                    "focus:wby-bg-neutral-dark/5"
                ]
            },
            size: {
                md: ["wby-px-sm-extra wby-py-xs-plus wby-rounded-md"],
                lg: ["wby-px-sm-extra wby-py-sm-plus wby-rounded-md"],
                xl: ["wby-px-md-extra wby-p-md wby-rounded-lg"]
            },
            invalid: {
                true: ""
            },
            disabled: {
                true: "wby-pointer-events-none"
            }
        },
        compoundVariants: [
            {
                variant: "primary",
                invalid: true,
                class: "!wby-border-destructive-default"
            },
            {
                variant: "secondary",
                invalid: true,
                class: "!wby-border-destructive-default"
            },
            {
                variant: "ghost",
                invalid: true,
                class: "!wby-border-destructive-subtle !wby-bg-destructive-subtle"
            },
            {
                variant: "primary",
                disabled: true,
                class: "wby-bg-neutral-disabled wby-border-neutral-dimmed wby-text-neutral-disabled placeholder:wby-text-neutral-disabled"
            },
            {
                variant: "secondary",
                disabled: true,
                class: "wby-bg-neutral-disabled wby-text-neutral-disabled placeholder:wby-text-neutral-disabled"
            },
            {
                variant: "ghost",
                disabled: true,
                class: "wby-bg-transparent wby-text-neutral-disabled placeholder:wby-text-neutral-disabled"
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "lg"
        }
    }
);

interface EditorJSType {
    destroy?: () => void;
    save: () => Promise<any>;
}

interface OnReadyParams {
    editor: any;
    initialData: OutputData;
}

type RichTextEditorValue = OutputBlockData[];

interface RichTextEditorPrimitiveProps
    extends Omit<React.ComponentProps<"div">, "onChange">,
        VariantProps<typeof richTextEditorVariants> {
    /**
     * If true, the editor will automatically focus when mounted.
     */
    autofocus?: boolean;
    /**
     * Additional class names to apply to the editor container.
     */
    className?: string;
    /**
     * Context object to pass to the editor tools.
     */
    context?: { [key: string]: any };
    /**
     * If true, the editor will be disabled.
     */
    disabled?: boolean;
    /**
     * Log level for the editor (e.g., "ERROR", "WARN").
     */
    logLevel?: string;
    /**
     * Minimum height of the editor in pixels.
     */
    minHeight?: number;
    /**
     * Callback function to handle changes in the editor content.
     */
    onChange?: (data: RichTextEditorValue) => void;
    /**
     * Callback function to handle the editor's readiness state.
     */
    onReady?: (params: OnReadyParams) => void;
    /**
     * Placeholder text to display when the editor is empty.
     */
    placeholder?: string;
    /**
     * Configuration for sanitizing the editor content.
     */
    sanitizer?: SanitizerConfig;
    /**
     * Configuration for the editor tools.
     */
    tools?: {
        [toolName: string]: ToolSettings;
    };
    /**
     * Initial value of the editor content.
     */
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

const RichTextEditorPrimitive = ({
    disabled,
    size,
    className,
    variant,
    invalid,
    ...props
}: RichTextEditorPrimitiveProps) => {
    const elementId = useRef("rte-" + generateId());
    const editorRef = useRef<EditorJSType | null>(null);

    useEffect(() => {
        const { value, context, onReady, ...nativeProps } = props;

        const initialData = value ? { blocks: value } : { blocks: [] };

        const clearWait = waitForDom(elementId.current, () => {
            editorRef.current = new EditorJS({
                ...nativeProps,
                style: {
                    ...nativeProps.style,
                    // @ts-expect-error
                    nonce: nativeProps.style?.nonce || nativeProps.nonce
                },
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

    return (
        <div
            id={elementId.current}
            className={cn(richTextEditorVariants({ variant, invalid, size, disabled }), className)}
        />
    );
};

export {
    RichTextEditorPrimitive,
    type RichTextEditorPrimitiveProps,
    type RichTextEditorValue,
    type OnReadyParams
};
