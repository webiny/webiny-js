import * as React from "react";
import { CmsContentDetailsPlugin } from "@webiny/app-headless-cms/types";
import Header from "./Header";
import RevisionSelector from "./revisionSelector/RevisionSelector";
import LocaleSelector from "./localeSelector/LocaleSelector";
import PublishRevision from "./publishRevision/PublishRevision";
import DeleteContent from "./deleteContent/DeleteContent";

const plugins: CmsContentDetailsPlugin[] = [
    {
        name: "cms-content-details-header",
        type: "cms-content-details-revision-content-preview",
        render(props) {
            return <Header {...props} />;
        }
    },
    {
        name: "cms-content-details-revision-selector",
        type: "cms-content-details-header-right",
        render(props) {
            return <RevisionSelector {...props} />;
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
        name: "cms-content-details-header-publish",
        type: "cms-content-details-header-right",
        render(props) {
            return <PublishRevision {...props} />;
        }
    },
    {
        name: "cms-content-details-header-delete",
        type: "cms-content-details-header-right",
        render(props) {
            return <DeleteContent {...props} />;
        }
    }
];

export default plugins;
