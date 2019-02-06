// @flow
import * as React from "react";
import { withImageUpload, SingleImageUpload } from "webiny-app/components";

const PageImage = props => {
    return <SingleImageUpload {...props} />;
};

export default withImageUpload()(PageImage);
