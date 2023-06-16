import React from "react";
import { ParagraphConfig } from "~/editor/lexicalConfig/ParagraphConfig";
import { HeadingConfig } from "~/editor/lexicalConfig/HeadingConfig";

/*
 * Lexical editor public Config API
 */
export const LexicalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return { children };
};

LexicalEditorConfig.Heading = HeadingConfig;
LexicalEditorConfig.Paragraph = ParagraphConfig;
