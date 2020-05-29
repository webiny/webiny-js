import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";
import { makeRenderImagePreview } from "./utils";

const imageExtensions = [".jpg", ".jpeg", ".gif", ".png", ".svg"];

const MultipleFile = props => {
    const [isImage, setIsImage] = React.useState(true);
    // Update `previewURL`
    React.useEffect(() => {
        if (props.bind.value && props.bind.value.includes("http")) {
            const key = props.bind.value.split("/").pop();
            if (props.previewURLs[key] === undefined) {
                props.setPreviewURLs({ ...props.previewURLs, [key]: null });
            }
        }
    }, [props.bind.value, props.previewURLs]);
    // Update `isImage`
    React.useEffect(() => {
        if (props.bind.value) {
            setIsImage(imageExtensions.some(extension => props.bind.value.includes(extension)));
        }
    }, [props.bind.value]);

    const getImageSrc = React.useCallback(() => {
        if (imageExtensions.some(extension => props.bind.value.includes(extension))) {
            return props.bind.value;
        }
        return fileIcon;
    }, [props.bind.value]);

    const getValue = React.useCallback(() => {
        if (!props.bind.value) {
            return props.bind.value;
        }

        return { src: props.previewURLs[props.bind.value] || getImageSrc() };
    }, [props.previewURLs, props.bind.value]);

    return <SingleImageUpload
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
                    })
                }
                props.setPreviewURLs(newPreviewURLs);
            } else {
                props.removeValue();
                props.setPreviewURLs({ ...props.previewURLs, [props.bind.value]: null });
            }
        }}
        value={getValue()}
        imagePreviewProps={{ transform: { width: 300 }, style: { width: '100%', height: '100%', objectFit: 'contain' } }}
        accept={[]}
        multiple={props.field.multipleValues}
        placeholder="Select a file"
        styles={{ width: '100%', height: 200 }}
        renderImagePreview={!isImage && makeRenderImagePreview(props.bind.value)}
    />;
};

export default MultipleFile;
