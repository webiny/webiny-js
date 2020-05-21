import * as React from "react";
import MultiImageUpload from "@webiny/app-admin/components/MultiImageUpload";

const SingleImage = props => {
    return <MultiImageUpload {...props.bind} imagePreviewProps={{ transform: { width: 300 } }} />;
};

export default SingleImage;
