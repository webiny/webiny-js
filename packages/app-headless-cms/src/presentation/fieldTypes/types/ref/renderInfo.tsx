import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import type { CmsModel as BaseCmsModel, CmsModelField } from "~/types.js";
import { Tag } from "@webiny/admin-ui";
import { ListModelsFeature } from "~/features/model/listModels/feature.js";

type CmsModel = Pick<BaseCmsModel, "modelId" | "name">;

interface RenderInfoParams {
    field: CmsModelField;
    model: CmsModel;
}

const takeBadges = 1;

export const renderInfo = ({ model, field }: RenderInfoParams) => {
    return <RenderInfo model={model} field={field} />;
};

const RenderInfo = observer(({ field }: RenderInfoParams) => {
    const { useCase } = useFeature(ListModelsFeature);

    const [models, setModels] = React.useState<CmsModel[]>([]);

    React.useEffect(() => {
        useCase.execute().then(setModels).catch(console.error);
    }, []);

    const { items, badges } = useMemo(() => {
        const fieldModels = (field.settings?.models || [])
            .map(model => {
                return models.find(m => m.modelId === model.modelId);
            })
            .filter(Boolean) as CmsModel[];
        return {
            items: fieldModels.slice(0, takeBadges),
            badges: fieldModels.length - takeBadges
        };
    }, [models, field]);

    if (models.length === 0) {
        return null;
    }

    return (
        <div className={"flex justify-end items-center gap-sm"}>
            {items.map(model => {
                return <Badge key={`model-${model.modelId}`} model={model} />;
            })}
            {badges > 0 && <Tag content={`+${badges}`} />}
        </div>
    );
});

const Badge = ({ model }: { model: CmsModel }) => {
    return <Tag content={model.name} />;
};
