import React, { useCallback } from "react";
import type { FileManagerFileItem } from "~/index.js";
import { FileManager } from "~/index.js";
import type { FormComponentProps } from "@webiny/ui/types.js";
import { FileItem, FilePicker, type FilePickerProps } from "@webiny/admin-ui";

export interface SingleImageUploadProps extends FormComponentProps {
    /**
     * Accept types
     */
    accept?: string[];

    /**
     * Component label.
     */
    label?: string;

    /**
     * Is component disabled?
     */
    disabled?: boolean;

    /**
     * Description beneath the image.
     */
    description?: React.ReactNode;

    /**
     * A className for the root element.
     */
    className?: string;

    /**
     * Define file's max allowed size (default is "10mb").
     * Uses "bytes" (https://www.npmjs.com/package/bytes) library to convert string notation to actual number.
     */
    maxSize?: number | string;

    /**
     * onChange callback when a file is set or unset.
     * It is marked as `optional` because this component is often used in conjunction with <Bind>, which injects the
     * `onChange` into its child element. In that case, that prop is not passed by the developer.
     */
    onChange?: (value: Pick<FileManagerFileItem, "id" | "src"> | null) => void;

    /**
     * Optional custom props, passed to the preview image.
     */
    imagePreviewProps?: any;

    /**
     * By default, file meta is not included in the data passed to `onChange`. If you need it, set this flag to true.
     */
    includeFileMeta?: boolean;

    /**
     * Is the wrapper round?
     * @deprecated Provide a custom `renderImagePreview` instead.
     */
    round?: boolean;

    /**
     * Render the image preview.
     */
    renderFilePreview?: FilePickerProps["renderFilePreview"];

    /**
     * Render the trigger button.
     */
    renderTrigger?: FilePickerProps["renderTrigger"];

    /**
     * Component type.
     */
    type?: FilePickerProps["type"];

    /**
     * Component variant.
     */
    variant?: FilePickerProps["variant"];
}

const SingleImageUpload = (props: SingleImageUploadProps) => {
    const {
        accept,
        className,
        description,
        disabled,
        includeFileMeta = false,
        label,
        maxSize,
        renderFilePreview,
        renderTrigger,
        validation,
        value,
        variant,
        type
    } = props;

    const onChange = useCallback(
        (value: FileManagerFileItem | null) => {
            if (!props.onChange) {
                return;
            }

            if (value && !includeFileMeta) {
                props.onChange({ id: value.id, src: value.src });
                return;
            }

            if (value && includeFileMeta) {
                props.onChange(value);
                return;
            }

            props.onChange(null);
        },
        [props.onChange]
    );

    return (
        <FileManager
            onChange={onChange}
            accept={accept}
            images={!accept}
            maxSize={maxSize}
            render={({ showFileManager }) => (
                <>
                    <FilePicker
                        label={label}
                        description={description}
                        validation={validation}
                        className={className}
                        disabled={disabled}
                        value={value ? FileItem.createFromUrl(value.src) : null}
                        onSelectItem={showFileManager}
                        onRemoveItem={() => onChange(null)}
                        renderFilePreview={renderFilePreview}
                        renderTrigger={renderTrigger}
                        variant={variant}
                        type={type}
                    />
                </>
            )}
        />
    );
};

export default SingleImageUpload;
