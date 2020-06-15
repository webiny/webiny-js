import * as React from "react";
import { CmsContentDetailsPlugin } from "@webiny/app-headless-cms/types";
import Header from "./Header";
import RevisionSelector from "./revisionSelector/RevisionSelector";
import LocaleSelector from "./localeSelector/LocaleSelector";
import PublishRevision from "./publishRevision/PublishRevision";
import DeleteContent from "./deleteContent/DeleteContent";
import SaveContentButton from "./saveContent/SaveContent";
import SaveAndPublishButton from "./saveAndPublishContent/SaveAndPublishContent";

const plugins: CmsContentDetailsPlugin[] = [
    {
        name: "cms-content-details-header",
        type: "cms-content-details-revision-content-preview",
        render(props) {
            return <Header {...props} />;
        }
    },
    {
        name: "cms-content-details-locale-selector",
        type: "cms-content-details-header-left",
        render(props) {
            return <LocaleSelector {...props} />;
        }
    },
    {
        name: "cms-content-details-revision-selector",
        type: "cms-content-details-header-left",
        render(props) {
            return <RevisionSelector {...props} />;
        }
    },
    {
        name: "cms-content-details-header-publish",
        type: "cms-content-details-header-left",
        render(props) {
            return <PublishRevision {...props} />;
        }
    },
    {
        name: "cms-content-details-header-delete",
        type: "cms-content-details-header-left",
        render(props) {
            return <DeleteContent {...props} />;
        }
    },
    {
        name: "cms-content-details-header-save",
        type: "cms-content-details-header-right",
        render: props => {
            return <SaveContentButton {...props} />;
        }
    },
    {
        name: "cms-content-details-header-save-and-publish",
        type: "cms-content-details-header-right",
        render: props => {
            return <SaveAndPublishButton {...props} />;
        }
    }
];

export default plugins;
