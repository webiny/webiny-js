import { useBind } from "@webiny/form";
import React from "react";
import { FileManagerViewConfig } from "~/index";
import { FileManagerRenderer } from "./FileManagerView";

const FilterByYear = () => {
    const bind = useBind({
        name: "extensions.year"
    });

    return <button onClick={() => bind.onChange(2018)}>Filter year 2018</button>;
};

const FilterByMake = () => {
    const bind = useBind({
        name: "extensions.carMake_contains"
    });

    return <button onClick={() => bind.onChange("Honda")}>Find me a Honda!</button>;
};

export const FileManagerRendererModule = () => {
    return (
        <>
            <FileManagerRenderer />
            <FileManagerViewConfig>
                <FileManagerViewConfig.Browser.Filter name={"year"} element={<FilterByYear />} />
                <FileManagerViewConfig.Browser.Filter name={"honda"} element={<FilterByMake />} />
            </FileManagerViewConfig>
        </>
    );
};
