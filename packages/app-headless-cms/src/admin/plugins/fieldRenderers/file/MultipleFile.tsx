import React, { useState, useEffect, useCallback } from "react";
import FileUpload from "./FileUpload";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";
import { createRenderImagePreview, imageWrapperStyles, imageExtensions } from "./utils";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/file");

const imagePreviewProps = {
    transform: { width: 300 },
    style: { width: "100%", height: 232, objectFit: "cover" }
};

const MultipleFile = props => {
    const [isImage, setIsImage] = useState(true);
    // Update `previewURL`
    useEffect(() => {
        if (props.bind.value && props.bind.value.includes("http")) {
            const key = props.bind.value.split("/").pop();
            if (props.previewURLs[key] === undefined) {
                props.setPreviewURLs({ ...props.previewURLs, [key]: null });
            }
        }
    }, [props.bind.value, props.previewURLs]);
    // Update `isImage`
    useEffect(() => {
        if (props.bind.value) {
            setIsImage(imageExtensions.some(extension => props.bind.value.includes(extension)));
        }
    }, [props.bind.value]);

    const getImageSrc = useCallback(() => {
        if (imageExtensions.some(extension => props.bind.value.includes(extension))) {
            return props.bind.value;
        }
        return fileIcon;
    }, [props.bind.value]);

    const getValue = useCallback(() => {
        if (!props.bind.value) {
            return props.bind.value;
        }

        return { src: props.previewURLs[props.bind.value] || getImageSrc() };
    }, [props.previewURLs, props.bind.value]);

    return (
        <FileUpload
            {...props.bind}
            onChange={value => {
                if (value !== null) {
                    const keys = value.map(file => file.key);
                    const newPreviewURLs = { ...props.previewURLs };
                    if (keys.length === 1) {
                        props.bind.onChange(keys[0]);

                        newPreviewURLs[keys[0]] = value[0].src;
                    } else {
                        props.appendValue(keys);
                        value.forEach(file => {
                            newPreviewURLs[file.key] = file.src;
                        });
                    }
                    props.setPreviewURLs(newPreviewURLs);
                } else {
                    props.removeValue();
                    props.setPreviewURLs({ ...props.previewURLs, [props.bind.value]: null });
                }
            }}
            value={getValue()}
            imagePreviewProps={imagePreviewProps}
            multiple={props.field.multipleValues}
            placeholder={t`Select a file"`}
            className={imageWrapperStyles}
            renderImagePreview={
                !isImage && createRenderImagePreview({ value: props.bind.value, imagePreviewProps })
            }
        />
    );
};

export default MultipleFile;
