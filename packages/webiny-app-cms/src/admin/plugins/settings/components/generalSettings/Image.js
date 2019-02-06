// @flow
import * as React from "react";
import { withImageUpload, SingleImageUpload } from "webiny-app/components";

const Image = props => {
    return <SingleImageUpload {...props} />;
};

export default withImageUpload()(Image);
