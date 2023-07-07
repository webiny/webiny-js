import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { FileManagerViewConfig } from "@webiny/app-file-manager";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import "./App.scss";

export const FilterBySize = () => {
    const bind = useBind({
        name: "size",
        defaultValue: "",
        beforeChange(value, cb) {
            cb(value === "all" ? undefined : value);
        }
    });

    const options = [
        { label: "All", value: "all" },
        { label: "> 200KB", value: "gt:204800" },
        { label: "< 200KB", value: "lt:204800" }
    ];

    return <Select {...bind} placeholder={"Filter by size"} options={options} size="medium" />;
};

const { Browser } = FileManagerViewConfig;

const convertFilters = ({ size, ...rest }: any) => {
    if (size === undefined) {
        return rest;
    }

    const [operator, value] = size.split(":");
    return { ...rest, [`size_${operator}`]: parseInt(value) };
};

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <FileManagerViewConfig>
                <Browser.Filter name={"size"} element={<FilterBySize />} />
                <Browser.FiltersToWhere converter={convertFilters} />
            </FileManagerViewConfig>
        </Admin>
    );
};
