import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { Editor } from "~/modelEditor";

export const ContentTabsPlugin = createComponentPlugin(Editor.ContentTab, OriginalTab => {
    return function ContentTab({ children, ...props }) {
        if (props.label === "Edit") {
            const newProps = { ...props, label: "Content Fields" };

            return (
                <>
                    <OriginalTab {...newProps}>{children}</OriginalTab>
                    <Editor.ContentTab label={"Settings Fields"}></Editor.ContentTab>
                </>
            );
        }

        return <OriginalTab {...props}>{children}</OriginalTab>;
    };
});
