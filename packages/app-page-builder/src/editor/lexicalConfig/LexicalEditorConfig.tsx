import React from "react";
import { Paragraph } from "~/editor/lexicalConfig/ParagraphConfig";
import { Heading } from "~/editor/lexicalConfig/HeadingConfig";

/*
 * Lexical editor public Config API
 */
export const LexicalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

LexicalEditorConfig.Heading = Heading;
LexicalEditorConfig.Paragraph = Paragraph;
