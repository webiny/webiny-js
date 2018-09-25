// @flow
import * as React from "react";
import { withFileUpload } from "webiny-app/components";
import { SingleImageUpload } from "webiny-ui/ImageUpload";

const AvatarImage = props => {
    return <SingleImageUpload {...props} />;
};

export default withFileUpload()(AvatarImage);
