import * as React from "react";
import { makeRenderImagePreview } from "./utils";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";

const imageExtensions = [".jpg", ".jpeg", ".gif", ".png", ".svg"];

const SingleFile = props => {
    const [previewURL, setPreviewURL] = React.useState(null);
    const [isImage, setIsImage] = React.useState(true);
    // Update `previewURL`
    React.useEffect(() => {
        if (props.bind.value && props.bind.value.includes("http")) {
            setPreviewURL(null);
        }
    }, [props.bind.value]);
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

        return { src: previewURL || getImageSrc() };
    }, [previewURL, props.bind.value]);

    return <SingleImageUpload
        {...props.bind}
        onChange={value => {
            if (value !== null) {
                props.bind.onChange(value.key);
                setPreviewURL(value.src);
            } else {
                props.bind.onChange(value);
                setPreviewURL(value);
            }
        }}
        value={getValue()}
        imagePreviewProps={{ transform: { width: 400 }, style: { width: '100%', height: 300, objectFit: 'contain' } }}
        accept={[]}
        placeholder="Select a file"
        renderImagePreview={!isImage && makeRenderImagePreview(props.bind.value)}
    />;
};

export default SingleFile;
