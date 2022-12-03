import React from "react";
import { Center } from "./DropZone/Center";
import { Horizontal, HorizontalPropsType } from "./DropZone/Horizontal";
import { Vertical, VerticalPropsType } from "./DropZone/Vertical";
import { makeComposable } from "@webiny/react-composition";

export default {
    Above: makeComposable("Dropzone.Above", (props: HorizontalPropsType) => {
        return <Horizontal {...props} />;
    }),
    Below: makeComposable("Dropzone.Below", (props: HorizontalPropsType) => {
        return <Horizontal {...props} below />;
    }),
    Left: makeComposable("Dropzone.Left", (props: VerticalPropsType) => {
        return <Vertical {...props} />;
    }),
    Right: makeComposable("Dropzone.Right", (props: VerticalPropsType) => {
        return <Vertical {...props} last />;
    }),
    Center: makeComposable("Dropzone.Center", Center)
};
