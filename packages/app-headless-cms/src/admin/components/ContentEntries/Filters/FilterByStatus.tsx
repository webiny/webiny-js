import React, { useMemo } from "react";

import { useBind } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { Select } from "@webiny/ui/Select";

import { DropdownContainer } from "./styles";

import { CmsEntryFilterStatusPlugin } from "@webiny/app-headless-cms-common/types";

export const FilterByStatus: React.FC = () => {
    const bind = useBind({
        name: "status",
        defaultValue: "",
        beforeChange(value, cb) {
            cb(value === "all" ? undefined : value);
        }
    });

    const filterStatusPlugins = useMemo(() => {
        return plugins.byType<CmsEntryFilterStatusPlugin>("cms.entry.filter.status");
    }, []);

    const options = [
        { label: "All", value: "all" },
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Unpublished", value: "unpublished" }
    ];

    filterStatusPlugins.forEach(pl => {
        options.push({ label: pl.label, value: pl.value });
    });

    return (
        <DropdownContainer>
            <Select {...bind} size={"medium"} placeholder={"Filter by status"} options={options} />
        </DropdownContainer>
    );
};
