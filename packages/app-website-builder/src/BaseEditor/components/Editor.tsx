import React, { useEffect, useState } from "react";
import classSet from "classnames";
import type { WebsiteBuilderTheme } from "@webiny/website-builder-sdk";
import DragPreview from "./DragPreview.js";
import { EditorConfig, EditorWithConfig } from "../config/index.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { ThemeProvider } from "~/BaseEditor/components/ThemeProvider.js";

export const Editor = () => {
    const editor = useDocumentEditor();
    const [theme, setTheme] = useState<WebsiteBuilderTheme | undefined>(undefined);

    useEffect(() => {
        editor.registerCommandHandler(Commands.SetTheme, ({ theme }) => {
            setTheme(theme);
        });
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <div className={classSet("w-full")}>
                <EditorWithConfig>
                    <EditorConfig.Ui.Layout />
                </EditorWithConfig>
                <DragPreview />
            </div>
        </ThemeProvider>
    );
};
