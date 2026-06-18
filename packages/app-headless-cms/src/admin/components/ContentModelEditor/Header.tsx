import React from "react";
import { HeaderBar } from "@webiny/admin-ui";
import { renderPlugins } from "@webiny/app/plugins/index.js";

const EditorBar = () => {
    return (
        <HeaderBar
            data-testid={"cms-editor-top-bar"}
            start={
                <div className={"flex items-center justify-start"}>
                    {renderPlugins("content-model-editor-default-bar-left")}
                </div>
            }
            end={
                <div className={"flex items-center justify-end"}>
                    {renderPlugins("content-model-editor-default-bar-right")}
                </div>
            }
        />
    );
};

export default EditorBar;
