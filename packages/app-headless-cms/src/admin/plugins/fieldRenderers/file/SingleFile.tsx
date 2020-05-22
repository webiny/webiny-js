import * as React from "react";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const SingleImage = props => {
    return <SingleImageUpload {...props.bind} imagePreviewProps={{ transform: { width: 300 } }} round />;
};

export default SingleImage;
