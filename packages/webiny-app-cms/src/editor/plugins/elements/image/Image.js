// @flow
import * as React from "react";
import { withFileUpload } from "webiny-app/components";
import { SingleImageUpload } from "webiny-ui/ImageUpload";

const Image = ({ element, ...props }) => {
    return (
        <div id={element.type + "-" + element.id}>
            <SingleImageUpload {...props} />
        </div>
    );
};

export default withFileUpload()(Image);
