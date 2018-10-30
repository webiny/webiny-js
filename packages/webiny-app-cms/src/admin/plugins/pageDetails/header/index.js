// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import Header from "./Header";
import RevisionSelector from "./revisionSelector/RevisionSelector";
import PublishRevision from "./publishRevision/PublishRevision";
import EditRevision from "./editRevision/EditRevision";
import DeletePage from "./deletePage/DeletePage";

export default ([
    {
        name: "cms-page-details-header",
        type: "cms-page-details-revision-content-preview",
        render(props: WithPageDetailsProps) {
            return <Header {...props} />;
        }
    },
    {
        name: "cms-page-details-revision-selector",
        type: "cms-page-details-header-left",
        render(props: WithPageDetailsProps) {
            return <RevisionSelector {...props} />;
        }
    },
    {
        name: "cms-page-details-header-publish",
        type: "cms-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <PublishRevision {...props} />;
        }
    },
    {
        name: "cms-page-details-header-edit",
        type: "cms-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <EditRevision {...props} />;
        }
    },
    {
        name: "cms-page-details-header-delete",
        type: "cms-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <DeletePage {...props} />;
        }
    }
]: Array<CmsPageDetailsPluginType>);
