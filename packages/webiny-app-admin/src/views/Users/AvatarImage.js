// @flow
import * as React from "react";
import { withFileUpload } from "webiny-app/components";
import { Image } from "webiny-ui/Image";

const AvatarImage = props => {
    return (
        <Image {...props}/>
    );
};

export default withFileUpload()(AvatarImage);
