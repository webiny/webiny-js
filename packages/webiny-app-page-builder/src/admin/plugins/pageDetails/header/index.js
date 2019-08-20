// @flow
import * as React from "react";
import type { PbPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-page-builder/types";
import Header from "./Header";
import RevisionSelector from "./revisionSelector/RevisionSelector";
import PublishRevision from "./publishRevision/PublishRevision";
import EditRevision from "./editRevision/EditRevision";
import DeletePage from "./deletePage/DeletePage";
import PageOptionsMenu from "./pageOptionsMenu/PageOptionsMenu";

export default ([
    {
        name: "pb-page-details-header",
        type: "pb-page-details-revision-content-preview",
        render(props: WithPageDetailsProps) {
            return <Header {...props} />;
        }
    },
    {
        name: "pb-page-details-revision-selector",
        type: "pb-page-details-header-left",
        render(props: WithPageDetailsProps) {
            return <RevisionSelector {...props} />;
        }
    },
    {
        name: "pb-page-details-header-publish",
        type: "pb-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <PublishRevision {...props} />;
        }
    },
    {
        name: "pb-page-details-header-edit",
        type: "pb-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <EditRevision {...props} />;
        }
    },
    {
        name: "pb-page-details-header-delete",
        type: "pb-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <DeletePage {...props} />;
        }
    },
    {
        name: "pb-page-details-header-options-menu",
        type: "pb-page-details-header-right",
        render(props: WithPageDetailsProps) {
            return <PageOptionsMenu {...props} />;
        }
    }
]: Array<PageBuilderPageDetailsPluginType>);
