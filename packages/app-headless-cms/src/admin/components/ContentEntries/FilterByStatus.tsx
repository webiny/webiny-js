import React, { useMemo } from "react";
import { Select } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import type { CmsEntryFilterStatusPlugin } from "@webiny/app-headless-cms-common/types/index.js";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByStatus = () => {
    const bind = useBind({
        name: "status",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        const options = [
            { label: "All", value: "all" },
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Unpublished", value: "unpublished" }
        ];

        const filterStatusPlugins =
            plugins.byType<CmsEntryFilterStatusPlugin>("cms.entry.filter.status");

        filterStatusPlugins.forEach(plugin => {
            options.push({ label: plugin.label, value: plugin.value });
        });

        return options;
    }, []);

    return <Select {...bind} size={"md"} placeholder={"Filter by status"} options={options} />;
};
