// @flow
import * as React from "react";
import type { PbPageDetailsPluginType } from "@webiny/app-page-builder/types";
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
        render(props) {
            return <Header {...props} />;
        }
    },
    {
        name: "pb-page-details-revision-selector",
        type: "pb-page-details-header-left",
        render(props) {
            return <RevisionSelector {...props} />;
        }
    },
    {
        name: "pb-page-details-header-publish",
        type: "pb-page-details-header-right",
        render(props) {
            return <PublishRevision {...props} />;
        }
    },
    {
        name: "pb-page-details-header-edit",
        type: "pb-page-details-header-right",
        render(props) {
            return <EditRevision {...props} />;
        }
    },
    {
        name: "pb-page-details-header-delete",
        type: "pb-page-details-header-right",
        render(props) {
            return <DeletePage {...props} />;
        }
    },
    {
        name: "pb-page-details-header-options-menu",
        type: "pb-page-details-header-right",
        render(props) {
            return <PageOptionsMenu {...props} />;
        }
    }
]: Array<PbPageDetailsPluginType>);
