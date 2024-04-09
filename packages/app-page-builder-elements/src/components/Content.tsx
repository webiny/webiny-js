import React from "react";
import { Content as ContentType } from "~/types";
import { Element } from "./Element";

export interface ContentProps {
    content: ContentType;
}

export const Content = (props: ContentProps) => {
    return <Element element={props.content} />;
};
