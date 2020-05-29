import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";

const imageExtensions = [".jpg", ".jpeg", ".gif", ".png", ".svg"];

const SingleFile = props => {
    const [previewURL, setPreviewURL] = React.useState(null);

    React.useEffect(() => {
        if (props.bind.value && props.bind.value.includes("http")) {
            setPreviewURL(null);
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
        onChange={args => {
            if (args !== null) {
                props.bind.onChange(args.key);
                setPreviewURL(args.src);
            } else {
                props.bind.onChange(args);
                setPreviewURL(args);
            }
        }}
        value={getValue()}
        imagePreviewProps={{ transform: { width: 400 }, style: { minHeight: 150, maxHeight: 375, objectFit: 'contain' } }}
        accept={[]}
        placeholder="Select a file"
    />;
};

export default SingleFile;
