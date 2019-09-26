//@flow
import React from "react";
import Center from "./DropZone/Center";
import Horizontal from "./DropZone/Horizontal";
import Vertical from "./DropZone/Vertical";

export default {
    Above(props: Object) {
        return <Horizontal {...props} />;
    },
    Below(props: Object) {
        return <Horizontal {...props} below />;
    },
    Left(props: Object) {
        return <Vertical {...props} />;
    },
    Right(props: Object) {
        return <Vertical {...props} last />;
    },
    Center
};
