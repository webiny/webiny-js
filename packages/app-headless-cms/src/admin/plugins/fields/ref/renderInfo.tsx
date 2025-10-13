import React, { useEffect, useMemo, useState } from "react";
import type { CmsModel as BaseCmsModel, CmsModelField } from "~/types.js";
import { useQuery } from "~/admin/hooks/index.js";
import type { ListReferencedModelsQueryResult } from "~/admin/plugins/fields/ref/graphql.js";
import { LIST_REFERENCED_MODELS } from "~/admin/plugins/fields/ref/graphql.js";
import { useSnackbar } from "@webiny/app-admin";
import { Tag } from "@webiny/admin-ui";

type CmsModel = Pick<BaseCmsModel, "modelId" | "name">;

interface BadgeProps {
    model: CmsModel;
}

const Badge = ({ model }: BadgeProps) => {
    return <Tag content={model.name} />;
};

interface RenderInfoParams {
    field: CmsModelField;
    model: CmsModel;
}

const takeBadges = 1;

export const renderInfo = ({ model, field }: RenderInfoParams) => {
    return <RenderInfo model={model} field={field} />;
};

const RenderInfo = ({ field }: RenderInfoParams) => {
    const hasAnyModels = (field.settings?.models || []).length > 0;
    const { data, loading, error } = useQuery<ListReferencedModelsQueryResult>(
        LIST_REFERENCED_MODELS,
        {
            skip: !hasAnyModels
        }
    );

    const { showSnackbar } = useSnackbar();

    const [models, setModels] = useState<CmsModel[]>([]);

    useEffect(() => {
        if (!data || loading) {
            return;
        } else if (error) {
            showSnackbar(error.message);
            return;
        }

        setModels(data.listContentModels?.data || []);
    }, [data, loading]);

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
            {badges > 0 && <Tag content={`+${badges}`}></Tag>}
        </div>
    );
};
