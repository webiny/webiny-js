import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const AvatarImage = (props) => {
    return <SingleImageUpload {...props} imagePreviewProps={{ transform: { width: 300 } }} />;
};

export default AvatarImage;
