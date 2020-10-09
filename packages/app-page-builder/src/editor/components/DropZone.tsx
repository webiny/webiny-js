import React from "react";
import Center from "./DropZone/Center";
import Horizontal, { HorizontalPropsType } from "./DropZone/Horizontal";
import Vertical, { VerticalPropsType } from "./DropZone/Vertical";

export default {
    Above(props: HorizontalPropsType) {
        return <Horizontal {...props} />;
    },
    Below(props: HorizontalPropsType) {
        return <Horizontal {...props} below />;
    },
    Left(props: VerticalPropsType) {
        return <Vertical {...props} />;
    },
    Right(props: VerticalPropsType) {
        return <Vertical {...props} last />;
    },
    Center
};
