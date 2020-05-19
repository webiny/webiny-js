import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { CmsContentDetailsPlugin } from "@webiny/app-headless-cms/types";
import { Tabs } from "@webiny/ui/Tabs";

const plugin: CmsContentDetailsPlugin = {
    name: "cms-content-details-revision-content",
    type: "cms-content-details",
    render(props) {
        return (
            <Tabs>
                {({ switchTab }) => {
                    return renderPlugins(
                        "cms-content-details-revision-content",
                        { ...props, switchTab },
                        {
                            wrapper: false
                        }
                    );
                }}
            </Tabs>
        );
    }
};

export default plugin;
