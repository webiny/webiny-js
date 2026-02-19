import React from "react";
import { FloatingLinkEditorController } from "./FloatingLinkEditorController.js";
import "./FloatingLinkEditorPlugin.css";
import { LinkFormProps } from "./types.js";

export function FloatingLinkEditorPlugin(props: {
    LinkForm: React.FunctionComponent<LinkFormProps>;
}) {
    return <FloatingLinkEditorController LinkForm={props.LinkForm} />;
}
