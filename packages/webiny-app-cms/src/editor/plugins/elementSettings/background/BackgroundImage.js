// @flow
import * as React from "react";
import { withFileUpload, SingleImageUpload } from "webiny-app/components";

const BackgroundImage = props => {
    return <SingleImageUpload {...props} />;
};

export default withFileUpload()(BackgroundImage);
