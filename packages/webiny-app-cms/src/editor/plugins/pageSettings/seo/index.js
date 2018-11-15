// @flow
import * as React from "react";
import { ReactComponent as SeoIcon } from "./round-search-24px.svg";
import GeneralSettings from "./GeneralSettings";

export default {
    name: "cms-editor-page-settings-seo",
    type: "cms-editor-page-settings",
    title: "SEO",
    description: "Control SEO settings like description and keywords.",
    icon: <SeoIcon />,
    render(props: Object) {
        return <GeneralSettings {...props} />;
    }
};
