import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const getImagePreviewStyles = (round: boolean) => ({
    width: '100%',
    height: '100%',
    maxWidth: 150,
    maxHeight: 150,
    borderRadius: round ? "50%" : "unset",
    objectFit: "cover"
});

const AvatarImage = props => {
    return <SingleImageUpload {...props} imagePreviewProps={{ transform: { width: 300 }, style: getImagePreviewStyles(props.round) }} />;
};

export default AvatarImage;
