import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const SingleImage = props => {
    const [previewURL, setPreviewURL] = React.useState(null)

    React.useEffect(() => {
        if (props.bind.value && props.bind.value.includes("http")) {
            setPreviewURL(null);
        }
    }, [props.bind.value])

    return <SingleImageUpload
        {...props.bind}
        onChange={args => {
            props.bind.onChange(args.key);
            setPreviewURL(args.src);
        }}
        value={props.bind.value && !props.bind.value.src ? { src: previewURL || props.bind.value } : props.bind.value}
        imagePreviewProps={{ transform: { width: 400 }, style: { maxHeight: 375, objectFit: 'contain' } }}
    />;
};

export default SingleImage;
