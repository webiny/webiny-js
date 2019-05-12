// @flow
import * as React from "react";
import SingleImageUpload from "webiny-admin/components/SingleImageUpload";

const AvatarImage = (props: Object) => {
    return <SingleImageUpload {...props} imagePreviewProps={{ transform: { width: 300 } }} />;
};

export default AvatarImage;
