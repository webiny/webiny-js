import React from "react";
import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";
import { Model } from "./Model";

interface Props {
    group: Pick<CmsGroup, "id">;
    models: Pick<CmsModel, "modelId" | "name" | "plugin">[];
    toggle: (model: string | Pick<CmsModel, "modelId">) => void;
    isSelected: (model: string | Pick<CmsModel, "modelId">) => boolean;
}

export const Models: React.VFC<Props> = ({ group, models, isSelected, toggle }) => {
    return (
        <div>
            {models.map(model => {
                return (
                    <Model
                        key={`model-${group.id}-${model.modelId}`}
                        isSelected={isSelected}
                        model={model}
                        toggle={toggle}
                    />
                );
            })}
        </div>
    );
};
