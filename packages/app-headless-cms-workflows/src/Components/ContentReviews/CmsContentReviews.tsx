import React from "react";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { CmsContentReviewsMount } from "./CmsContentReviewsMount.js";

/*
 * Content Reviews need the content type list, which the API refuses to a user who cannot read
 * CMS models: such a user gets no route, menu or widgets, and no failed model list.
 */
export const CmsContentReviews = () => {
    const { canAccessManageEndpoint, canReadContentModels } = usePermission();

    if (!canAccessManageEndpoint || !canReadContentModels) {
        return null;
    }

    return <CmsContentReviewsMount />;
};
