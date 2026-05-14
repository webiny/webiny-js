import React from "react";
import { Select } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";

export const FilterByType = () => {
    const bind = useBind({
        name: "type_startsWith",
        defaultValue: "",
        beforeChange(value, cb) {
            cb(value === "all" ? undefined : value);
        }
    });

    const options = [
        { label: "All", value: "all" },
        { label: "Images", value: "image/" },
        { label: "Videos", value: "video/" },
        { label: "Documents", value: "application/" }
    ];

    return <Select {...bind} placeholder={"Filter by type"} options={options} size={"md"} />;
};
