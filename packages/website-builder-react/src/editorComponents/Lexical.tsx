"use client";
import React from "react";
import type { ComponentProps } from "~/types.js";

export const createLexicalValue = (value: string) => {
    return {
        state: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"${value}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"wby-paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`,
        html: `<p class="wb-paragraph-1">${value}</p>`
    };
};

type LexicalProps = ComponentProps<{
    content: {
        html?: string;
    };
}>;

export const LexicalComponent = ({ inputs }: LexicalProps) => {
    const { html } = inputs.content;

    if (html) {
        return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
    }

    return null;
};
