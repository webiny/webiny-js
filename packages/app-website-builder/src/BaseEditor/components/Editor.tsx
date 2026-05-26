import React, { useEffect, useState } from "react";
import classSet from "classnames";
import { allNodes } from "@webiny/lexical-nodes";
import type { WebsiteBuilderTheme } from "@webiny/website-builder-sdk";
import { useLexicalContext } from "@webiny/app-admin/presentation/lexicalContext/useLexicalContext.js";
import { EditorConfig, EditorWithConfig } from "../config/index.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { ThemeProvider } from "~/BaseEditor/components/ThemeProvider.js";

export const Editor = () => {
    const { lexicalContext } = useLexicalContext();
    const editor = useDocumentEditor();
    const [theme, setTheme] = useState<WebsiteBuilderTheme | undefined>(undefined);

    useEffect(() => {
        editor.registerCommandHandler(Commands.SetTheme, ({ theme }) => {
            setTheme(theme);
            lexicalContext.setTheme(theme);
            lexicalContext.setNodes(allNodes);
        });
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <div className={classSet("w-full")}>
                <EditorWithConfig>
                    <EditorConfig.Ui.Layout />
                </EditorWithConfig>
            </div>
        </ThemeProvider>
    );
};
