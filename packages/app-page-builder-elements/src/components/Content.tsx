import React from "react";
import { Content as ContentType } from "~/types";
import { Element } from "./Element";

export interface Props {
    content: ContentType;
}

export const Content: React.FC<Props> = props => {
    return <Element element={props.content} />;
};
