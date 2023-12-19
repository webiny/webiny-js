import React, { useMemo } from "react";

import { useBind } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { Select } from "@webiny/ui/Select";

import { CmsEntryFilterStatusPlugin } from "@webiny/app-headless-cms-common/types";

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

    return <Select {...bind} size={"medium"} placeholder={"Filter by status"} options={options} />;
};
