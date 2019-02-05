// @flow
import * as React from "react";
import { withImageUpload, SingleImageUpload } from "webiny-app/components";

const AvatarImage = props => {
    return (
        <SingleImageUpload
            {...props}
            imagePreviewProps={{ transform: { width: 300 } }}
        />
    );
};

export default withImageUpload()(AvatarImage);
