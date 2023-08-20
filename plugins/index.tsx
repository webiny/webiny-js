import React from "react";
import { Website, Api, Theme } from "./webiny-plugins";

// Real code (the above is not visible to users).
export default () => {
    return (
        <>
            <Theme name={"light"} path={'./themes/light'} />
            <Theme name={"dark"} path={'./themes/dark'} />
            <Website.PublicAsset name="sitemap" path={"./public/sitemap.xml"} />
            <Api.Context name="log-version" path={"./api/logVersion"} />

            {/*<Website.OverrideOriginRequestLambda path={"./originRequestLambda"} />*/}
            {/*<FormBuilder.FormLayout*/}
            {/*    name={"default"}*/}
            {/*    title={"Default form layout"}*/}
            {/*    componentPath={"./layouts/forms/DefaultFormLayout"}*/}
            {/*/>*/}

            {/*<PageBuilder.PageLayout*/}
            {/*    name={"static"}*/}
            {/*    title={"Static page"}*/}
            {/*    componentPath={"./layouts/pages/Static"}*/}
            {/*/>*/}
            {/*<PageBuilder.PageElement*/}
            {/*    name={"spaceX"}*/}
            {/*    componentPath={"./pageElements/draggableImage"}*/}
            {/*    editorSettingsPath={"./pageElements/draggableImage"}*/}
            {/*/>*/}
            {/*<Infra.ApiConfig path={"./pageElements/draggableImage"} />*/}
            {/*<Api.Context path={"./api/addXYZToContext"} />*/}
        </>
    );
};
