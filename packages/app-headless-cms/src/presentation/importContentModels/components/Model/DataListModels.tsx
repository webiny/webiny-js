import React from "react";
import type { ImportModelData } from "../../types.js";
import { DataListModelItem } from "./DataListModelItem.js";
import { observer } from "mobx-react-lite";
import { useImportContentModelsPresenter } from "../../useImportContentModelsPresenter.js";

interface DataListModelsProps {
    models: ImportModelData[];
}

export const DataListModels = observer(({ models }: DataListModelsProps) => {
    const presenter = useImportContentModelsPresenter();
    const toggleModel = (item: Pick<ImportModelData, "id" | "name" | "related">) =>
        presenter.toggleModel(item);
    const isModelSelected = (item: Pick<ImportModelData, "id">) => presenter.isModelSelected(item);
    return (
        <div className={"p-[5px]"}>
            {models.map(model => {
                return (
                    <DataListModelItem
                        key={`model-${model.id}`}
                        model={model}
                        toggle={toggleModel}
                        selected={isModelSelected(model)}
                    />
                );
            })}
        </div>
    );
});
