// @flow
import * as React from "react";
import type { CmsFormDetailsPluginType, WithFormDetailsProps } from "webiny-app-forms/types";
import RevisionSelector from "./revisionSelector/RevisionSelector";
import PublishRevision from "./publishRevision/PublishRevision";
import EditRevision from "./editRevision/EditRevision";
import DeleteForm from "./deleteForm/DeleteForm";

export default ([
    {
        name: "forms-form-details-revision-selector",
        type: "forms-form-details-header-left",
        render(props: WithFormDetailsProps) {
            return <RevisionSelector {...props} />;
        }
    },
    {
        name: "forms-form-details-header-publish",
        type: "forms-form-details-header-right",
        render(props: WithFormDetailsProps) {
            return <PublishRevision {...props} />;
        }
    },
    {
        name: "forms-form-details-header-edit",
        type: "forms-form-details-header-right",
        render(props: WithFormDetailsProps) {
            return <EditRevision {...props} />;
        }
    },
    {
        name: "forms-form-details-header-delete",
        type: "forms-form-details-header-right",
        render(props: WithFormDetailsProps) {
            return <DeleteForm {...props} />;
        }
    }
]: Array<CmsFormDetailsPluginType>);
