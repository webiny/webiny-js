import React, { useCallback } from "react";
import type { ImportModelData } from "../../types.js";
import { DataListModelItemError } from "./DataListModelItemError.js";
import { DataListModelItemInfo } from "./DataListModelItemInfo.js";

const checkboxContainerClassName = "w-[120px] text-right align-middle";

type ToggleModelCb = (item: Pick<ImportModelData, "id" | "name" | "related">) => void;

const Imported = () => {
    return (
        <div className={checkboxContainerClassName}>
            <div
                className={
                    "inline-block py-px px-[5px] text-right text-[10px] leading-[12px] text-white outline-0"
                }
            >
                Imported.
            </div>
        </div>
    );
};

interface CheckboxProps {
    model: Pick<ImportModelData, "id" | "name" | "error" | "related">;
    toggle: ToggleModelCb;
    selected: boolean;
}

const Checkbox = ({ model, toggle, selected }: CheckboxProps) => {
    const onClick = useCallback(() => {
        toggle(model);
    }, [toggle]);
    if (model.error) {
        return null;
    }
    return (
        <div className={checkboxContainerClassName}>
            <button
                onClick={onClick}
                className={
                    "inline-block py-px px-[5px] text-right text-[10px] leading-[12px] cursor-pointer outline-0"
                }
            >
                {selected ? "Model will be imported" : "Model will be skipped"}
            </button>
        </div>
    );
};

const Container = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={"box-border w-full m-0 pt-0 px-[5px] pb-[15px] last:pb-xxs"}>
            {children}
        </div>
    );
};

interface DataListModelItemProps {
    model: ImportModelData;
    toggle: ToggleModelCb;
    selected: boolean;
}

export const DataListModelItem = ({ model, toggle, selected }: DataListModelItemProps) => {
    return (
        <Container>
            <div className={"flex flex-row items-center justify-between w-full"}>
                <div>
                    <h4 className={"text-[12px] flex-[1_0_auto] leading-[18px]"}>
                        {model.name || model.id}
                    </h4>
                    {model.error ? (
                        <DataListModelItemError error={model.error} />
                    ) : (
                        <DataListModelItemInfo model={model} />
                    )}
                </div>
                {model.imported ? (
                    <Imported />
                ) : (
                    <Checkbox model={model} toggle={toggle} selected={selected} />
                )}
            </div>
        </Container>
    );
};
