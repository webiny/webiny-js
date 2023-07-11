import * as React from "react";
import { CmsContentDetailsPlugin } from "~/types";
import RevisionSelector from "./revisionSelector/RevisionSelector";
import SaveContentButton from "./saveContent/SaveContent";
import { SaveAndPublishButton } from "./saveAndPublishContent/SaveAndPublishContent";
import ContentFormOptionsMenu from "./contentFormOptionsMenu/ContentFormOptionsMenu";

const plugins: CmsContentDetailsPlugin[] = [
    {
        name: "cms-content-details-revision-selector",
        type: "cms-content-details-header-left",
        render(props) {
            return <RevisionSelector {...props} />;
        }
    },
    {
        name: "cms-content-details-header-save",
        type: "cms-content-details-header-right",
        render(props) {
            return <SaveContentButton {...props} />;
        }
    },
    {
        name: "cms-content-details-header-save-and-publish",
        type: "cms-content-details-header-right",
        render(props) {
            return <SaveAndPublishButton {...props} />;
        }
    },
    {
        name: "cms-content-details-header-option-menu",
        type: "cms-content-details-header-right",
        render(props) {
            return <ContentFormOptionsMenu {...props} />;
        }
    }
];

export default plugins;