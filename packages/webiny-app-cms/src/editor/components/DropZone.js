//@flow
import React from "react";
import Center from "./DropZone/Center";
import Horizontal from "./DropZone/Horizontal";
import Vertical from "./DropZone/Vertical";

export default {
    Above(props) {
        return <Horizontal {...props} />;
    },
    Below(props) {
        return <Horizontal {...props} below />;
    },
    Left(props) {
        return <Vertical {...props} />;
    },
    Right(props) {
        return <Vertical {...props} last />;
    },
    Center
};
