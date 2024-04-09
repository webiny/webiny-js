import * as React from "react";
import { SingleImageUpload, SingleImageUploadProps } from "@webiny/app-admin";

const getImagePreviewStyles = (round: boolean) => ({
    width: 150,
    height: 150,
    borderRadius: round ? "50%" : "unset",
    objectFit: "cover"
});

const AvatarImage = (props: SingleImageUploadProps) => {
    return (
        <SingleImageUpload
            {...props}
            imagePreviewProps={{
                transform: { width: 300 },
                style: getImagePreviewStyles(props.round || false)
            }}
        />
    );
};

export default AvatarImage;
