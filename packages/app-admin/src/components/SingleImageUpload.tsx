import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import * as Ui from "@webiny/ui/ImageUpload";
import { FileManager, FileManagerFileItem } from "~/index";
import { FormComponentProps } from "@webiny/ui/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import styled from "@emotion/styled";
import { useCallback } from "react";

const ImageUploadWrapper = styled("div")({
    position: "relative",
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    ".mdc-floating-label--float-above": {
        transform: "scale(0.75)",
        top: 10,
        left: 10,
        color: "var(--mdc-theme-text-secondary-on-background)"
    },
    ".mdc-text-field-helper-text": {
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

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
    onChange?: (value: FileManagerFileItem | null) => void;

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
     */
    round?: boolean;

    /**
     * Define the properties that are returned on file(s) selection.
     * @deprecated Pick the desired file attributes in the `onChange` callback, or `beforeChange` on the `<Bind>` element.
     */
    onChangePick?: string[];
}

const SingleImageUpload = (props: SingleImageUploadProps) => {
    const {
        className,
        value,
        validation,
        label,
        description,
        accept,
        includeFileMeta = false,
        maxSize,
        imagePreviewProps,
        round
    } = props;

    const { isValid: validationIsValid, message: validationMessage } = validation || {};

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
        <ImageUploadWrapper className={className}>
            {label && (
                <div className="mdc-floating-label mdc-floating-label--float-above">{label}</div>
            )}

            <FileManager
                onChange={onChange}
                accept={accept}
                images={!accept}
                maxSize={maxSize}
                render={({ showFileManager }) => (
                    <Ui.Image
                        renderImagePreview={renderImageProps => (
                            <Image {...renderImageProps} {...imagePreviewProps} />
                        )}
                        style={{ width: "100%", height: "auto" }}
                        value={value}
                        uploadImage={showFileManager}
                        removeImage={() => onChange(null)}
                        round={round}
                    />
                )}
            />

            {validationIsValid === false && (
                <FormElementMessage error>{validationMessage}</FormElementMessage>
            )}
            {validationIsValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </ImageUploadWrapper>
    );
};

export default SingleImageUpload;
