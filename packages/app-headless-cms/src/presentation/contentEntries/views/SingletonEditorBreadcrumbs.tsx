import React from "react";
import { Breadcrumb } from "@webiny/app-admin";
import type { CmsModel } from "~/types.js";
import { Routes } from "~/routes.js";

export interface SingletonEditorBreadcrumbsProps {
    model: CmsModel;
}

/**
 * Emits the singleton trail (`Headless CMS › <Model>`) through the React Config API, the same
 * entries `ContentEntriesBreadcrumbs` emits for list models. A singleton has no list or folders,
 * so the trail ends at the model.
 */
export const SingletonEditorBreadcrumbs = ({ model }: SingletonEditorBreadcrumbsProps) => {
    return (
        <>
            <Breadcrumb
                name={"cms"}
                label={"Headless CMS"}
                to={{ route: Routes.ContentModels.List }}
            />
            <Breadcrumb
                name={"cms.model"}
                label={model.name}
                to={{ route: Routes.ContentEntries.List, params: { modelId: model.modelId } }}
            />
        </>
    );
};
