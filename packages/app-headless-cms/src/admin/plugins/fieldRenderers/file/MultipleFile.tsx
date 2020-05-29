import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";

const imageExtensions = [".jpg", ".jpeg", ".gif", ".png", ".svg"];

const MultipleFile = props => {
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
                const keys = args.map(file => file.key);

                if (keys.length === 1) {
                    props.bind.onChange(keys[0]);
                } else {
                    const [firstKey, ...restKeys] = keys;
                    props.bind.onChange(firstKey);
                    props.appendValue(restKeys);
                }
                setPreviewURL(args[0].src);
            } else {
                props.removeValue();
                setPreviewURL(null);
            }
        }}
        value={getValue()}
        imagePreviewProps={{ transform: { width: 400 }, style: { maxHeight: 375, objectFit: 'contain' } }}
        accept={[]}
        multiple={props.field.multipleValues}
        placeholder="Select a file"
    />;
};

export default MultipleFile;
