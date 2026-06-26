import React from "react";
import type { ImportModelData } from "../../types.js";
import styled from "@emotion/styled";
import { DataListModelItem } from "./DataListModelItem.js";
import { observer } from "mobx-react-lite";
import { useImportContentModelsPresenter } from "../../useImportContentModelsPresenter.js";

const Container = styled("div")({
    backgroundColor: "var(--mdc-theme-surface)",
    border: "1px dashed var(--mdc-theme-on-surface)",
    padding: "5px",
    borderBox: "box-sizing"
});

interface DataListModelsProps {
    models: ImportModelData[];
}

export const DataListModels = observer(({ models }: DataListModelsProps) => {
    const presenter = useImportContentModelsPresenter();
    const toggleModel = (item: Pick<ImportModelData, "id" | "name" | "related">) =>
        presenter.toggleModel(item);
    const isModelSelected = (item: Pick<ImportModelData, "id">) => presenter.isModelSelected(item);
    return (
        <Container>
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
        </Container>
    );
});
