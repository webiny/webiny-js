import React from "react";
import { Content as ContentType } from "~/types";
import { Element } from "./Element";

export interface ContentProps {
    content: ContentType;
}

export const Content: React.VFC<ContentProps> = props => {
    return <Element element={props.content} />;
};
