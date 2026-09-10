import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { makeDecoratable } from "@webiny/react-composition";
import type { BreadcrumbLink } from "@webiny/app-admin";
import { useModel } from "~/admin/hooks/index.js";

export interface BreadcrumbRootConfig {
    label: string;
    to?: BreadcrumbLink;
}

export interface BreadcrumbRootProps {
    /** Label of the leading breadcrumb (e.g. "Headless CMS", "Tenant Manager"). */
    label: string;
    /** Optional link for the root entry. */
    to?: BreadcrumbLink;
    /** Restrict this root to specific models (e.g. the tenant model). Empty = all models. */
    modelIds?: string[];
}

/**
 * Overrides the leading breadcrumb of the content-entries trail for apps that embed the
 * entries view (e.g. Tenant Manager reuses it for the tenant model). Scope it with `modelIds`,
 * mirroring the column/filter configs. When unset, the entries view defaults to "Headless CMS".
 */
export const BreadcrumbRoot = makeDecoratable(
    "BreadcrumbRoot",
    ({ label, to, modelIds = [] }: BreadcrumbRootProps) => {
        const { model } = useModel();
        const getId = useIdGenerator("breadcrumbRoot");

        if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
            return null;
        }

        return (
            <Property id="browser" name={"browser"}>
                <Property
                    id={getId("breadcrumbRoot")}
                    name={"breadcrumbRoot"}
                    value={{ label, to }}
                />
            </Property>
        );
    }
);
