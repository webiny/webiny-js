import React from "react";
import {
    type FileItemDto,
    type FileItemFormatted,
    FilePickerDescription,
    FilePickerLabel,
    type FilePickerPrimitiveProps,
    filePickerVariants,
    FilePreview,
    ImagePreview,
    RichItemPreview,
    TextOnlyPreview,
    Trigger
} from "~/FilePicker/index.js";
import { cn, makeDecoratable, withStaticProps } from "~/utils.js";
import { Button } from "~/Button/index.js";
import { inputVariants } from "~/Input/index.js";
import { useMultiFilePicker } from "~/MultiFilePicker/primitives/useMultiFilePicker.js";

interface MultiFilePickerPrimitiveProps extends Omit<
    FilePickerPrimitiveProps,
    "value" | "onEditItem" | "onRemoveItem"
> {
    /**
     * The list of file items or file paths.
     */
    values?: FileItemDto[] | string[] | null;
    /**
     * Placeholder text for the button that allows users to select a file.
     */
    buttonPlaceholder?: string;
    /**
     * Callback function to replace an item.
     */
    onReplaceItem: (item: FileItemFormatted | null, index: number) => void;
    /**
     * Optional callback function to edit an item.
     */
    onEditItem?: (item: FileItemFormatted | null, index: number) => void;
    /**
     * Optional callback function to remove an item.
     */
    onRemoveItem?: (item: FileItemFormatted | null, index: number) => void;
}

const BaseMultiFilePickerPrimitive = ({
    className,
    buttonPlaceholder,
    containerStyle,
    description,
    disabled,
    invalid,
    label,
    onEditItem,
    onRemoveItem,
    onReplaceItem,
    onSelectItem,
    placeholder,
    renderFilePreview,
    renderTrigger,
    type = "area",
    values = [],
    variant
}: MultiFilePickerPrimitiveProps) => {
    const { vm } = useMultiFilePicker({ values });

    return (
        <div
            data-disabled={disabled}
            className={cn(
                inputVariants({ variant, invalid }),
                filePickerVariants({ type, variant }),
                "max-h-[280px]",
                className
            )}
            style={containerStyle}
        >
            {(label || description) && (
                <div className={"w-full flex justify-between"}>
                    <div className={"w-full"}>
                        {label && (
                            <div className={"mb-xs"}>
                                {typeof label === "string" ? (
                                    <FilePickerLabel
                                        label={label}
                                        className={"m-0"}
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
                                className={"m-0"}
                            />
                        )}
                    </div>
                    {vm.hasFiles ? (
                        <Button
                            text={buttonPlaceholder ?? "Select a file"}
                            variant={"ghost"}
                            onClick={onSelectItem}
                            size={"sm"}
                            disabled={disabled}
                        />
                    ) : null}
                </div>
            )}
            {vm.hasFiles ? (
                <div className="w-full overflow-y-scroll flex flex-col gap-xs">
                    {vm.files.map((file, i) => (
                        <FilePreview
                            key={`file-preview-${i}`}
                            disabled={disabled}
                            onEditItem={onEditItem ? () => onEditItem(file, i) : undefined}
                            onRemoveItem={onRemoveItem ? () => onRemoveItem(file, i) : undefined}
                            onReplaceItem={onReplaceItem ? () => onReplaceItem(file, i) : undefined}
                            renderFilePreview={renderFilePreview}
                            type={type}
                            value={file}
                        />
                    ))}
                </div>
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

const DecoratableMultiFilePickerPrimitive = makeDecoratable(
    "MultiFilePickerPrimitive",
    BaseMultiFilePickerPrimitive
);

const MultiFilePickerPrimitive = withStaticProps(DecoratableMultiFilePickerPrimitive, {
    Preview: {
        Image: ImagePreview,
        RichItem: RichItemPreview,
        TextOnly: TextOnlyPreview
    }
});

export {
    MultiFilePickerPrimitive,
    type FileItemFormatted,
    type FileItemDto,
    type MultiFilePickerPrimitiveProps
};
