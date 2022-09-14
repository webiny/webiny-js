import React from "react";
import { Helmet } from "react-helmet";
import { Plugins, AddRoute } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { ContentModelEditor } from "./ContentModelEditor";

export const ContentModelEditorModule = () => {
    return (
        <Plugins>
            <HasPermission name={"cms.contentModel"}>
                <AddRoute exact path={"/cms/content-models/:modelId"}>
                    <>
                        <Helmet title={"Edit a Content Model"} />
                        <ContentModelEditor />
                    </>
                </AddRoute>
            </HasPermission>
        </Plugins>
    );
};
