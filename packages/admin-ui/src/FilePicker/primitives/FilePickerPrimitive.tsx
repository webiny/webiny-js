import * as React from "react";
import { cn, cva, type VariantProps, makeDecoratable, withStaticProps } from "~/utils";
import { FilePickerLabel, FilePickerDescription, Trigger } from "./components";
import { Label } from "~/Label";
import { InputPrimitiveProps, inputVariants } from "~/Input";
import { ImagePreview, RichItemPreview, TextOnlyPreview, FilePreview } from "./components";
import { FileItem, type FileItemDto, type FileItemFormatted } from "../domains";
import { useFilePicker } from "./useFilePicker";
import type { FilePreviewRendererProps, TriggerRendererProps } from "./components/types";

const filePickerVariants = cva(
    [
        "wby-w-full wby-border-sm wby-text-md wby-peer wby-rounded-md",
        "focus-visible:wby-outline-none",
        "data-[disabled=true]:wby-cursor-not-allowed",
        "wby-flex wby-flex-col wby-items-start wby-gap-y-sm-extra"
    ],
    {
        variants: {
            type: {
                area: [
                    "wby-px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))] wby-py-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                compact: [
                    "wby-py-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.sm)-theme(borderWidth.sm))]"
                ]
            },
            variant: {
                primary: "",
                secondary: "",
                ghost: ["hover:wby-bg-transparent"]
            }
        },
        defaultVariants: {
            type: "area",
            variant: "primary"
        }
    }
);

interface FilePickerPrimitiveProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof filePickerVariants> {
    /**
     * Custom styles for the container.
     */
    containerStyle?: React.CSSProperties;
    /**
     * Indicates if the file picker is disabled.
     */
    disabled?: boolean;
    /**
     * Indicates if the input field is invalid.
     * Refer to `InputPrimitiveProps["invalid"]` for possible values.
     */
    invalid?: InputPrimitiveProps["invalid"];
    /**
     * Label for the file picker.
     */
    label?: React.ReactElement<typeof Label> | React.ReactNode | string;
    /**
     * Description for the file picker.
     */
    description?: React.ReactNode | string;
    /**
     * Callback triggered when an item is edited.
     */
    onEditItem?: (item: FileItemFormatted | null) => void;
    /**
     * Callback triggered when an item is removed.
     */
    onRemoveItem?: (item: FileItemFormatted | null) => void;
    /**
     * Callback triggered when an item is selected.
     */
    onSelectItem: () => void;
    /**
     * Placeholder text for the file picker.
     */
    placeholder?: string;
    /**
     * Custom renderer for the file preview.
     */
    renderFilePreview?: (props: FilePreviewRendererProps) => React.ReactElement<any>;
    /**
     * Custom renderer for the trigger.
     */
    renderTrigger?: (props: TriggerRendererProps) => React.ReactElement<any>;
    /**
     * Custom styles for the file picker.
     */
    style?: React.CSSProperties;
    /**
     * Value of the selected file.
     */
    value?: FileItemDto | string | null;
}

const BaseFilePickerPrimitive = ({
    className,
    containerStyle,
    description,
    disabled,
    invalid,
    label,
    onEditItem,
    onRemoveItem,
    onSelectItem,
    placeholder,
    renderFilePreview,
    renderTrigger,
    type = "area",
    value,
    variant
}: FilePickerPrimitiveProps) => {
    const { vm } = useFilePicker({ value });

    return (
        <div
            data-disabled={disabled}
            className={cn(
                inputVariants({ variant, invalid }),
                filePickerVariants({ type, variant }),
                className
            )}
            style={containerStyle}
        >
            {type === "area" && (label || description) && (
                <div className={"wby-w-full"}>
                    {label && (
                        <div className={"wby-mb-xs"}>
                            {typeof label === "string" ? (
                                <FilePickerLabel
                                    label={label}
                                    className={"wby-m-0"}
                                    disabled={disabled}
                                />
                            ) : (
                                label
                            )}
                        </div>
                    )}
                    {description && (
                        <FilePickerDescription
                            description={description}
                            disabled={disabled}
                            className={"wby-m-0"}
                        />
                    )}
                </div>
            )}
            {vm.file ? (
                <FilePreview
                    disabled={disabled}
                    onEditItem={onEditItem ? () => onEditItem(vm.file) : undefined}
                    onRemoveItem={onRemoveItem ? () => onRemoveItem(vm.file) : undefined}
                    onReplaceItem={onSelectItem}
                    renderFilePreview={renderFilePreview}
                    type={type}
                    value={vm.file}
                />
            ) : (
                <Trigger
                    disabled={disabled}
                    onSelectItem={onSelectItem}
                    renderTrigger={renderTrigger}
                    text={placeholder}
                    type={type}
                    variant={variant}
                />
            )}
        </div>
    );
};

const DecoratableFilePickerPrimitive = makeDecoratable(
    "FilePickerPrimitive",
    BaseFilePickerPrimitive
);

const FilePickerPrimitive = withStaticProps(DecoratableFilePickerPrimitive, {
    Preview: {
        Image: ImagePreview,
        RichItem: RichItemPreview,
        TextOnly: TextOnlyPreview
    }
});

export { FilePickerPrimitive, FileItem, type FilePickerPrimitiveProps, filePickerVariants };
