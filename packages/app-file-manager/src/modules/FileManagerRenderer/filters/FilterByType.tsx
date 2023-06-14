import React from "react";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";

const DropdownContainer = styled.div`
    width: 200px;
`;

export const FilterByType = () => {
    const bind = useBind({
        name: "type_startsWith",
        defaultValue: "all",
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

    return (
        <DropdownContainer>
            <Select {...bind} label={"Filter by type"} options={options} />
        </DropdownContainer>
    );
};
