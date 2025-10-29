import React from "react";
import { CheckboxPrimitive } from "~/Checkbox/index.js";
import type { DataListProps } from "../types.js";

const MultiSelectAll = (props: DataListProps) => {
    const { multiSelectActions } = props;
    if (!multiSelectActions) {
        return null;
    }
    /**
     * We can safely cast because we have defaults.
     */
    const { isAllMultiSelected, isNoneMultiSelected, multiSelectAll, data } =
        props as Required<DataListProps>;

    return (
        <>
            {typeof multiSelectAll === "function" && (
                <div className={"size-lg flex items-center justify-center"}>
                    <CheckboxPrimitive
                        indeterminate={!isAllMultiSelected(data) && !isNoneMultiSelected(data)}
                        checked={isAllMultiSelected(data)}
                        onChange={() => {
                            multiSelectAll(!isAllMultiSelected(data), data);
                        }}
                    />
                </div>
            )}
        </>
    );
};

export { MultiSelectAll };
