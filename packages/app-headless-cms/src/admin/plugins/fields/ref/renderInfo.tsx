import React, { useEffect, useMemo, useState } from "react";
import { CmsModel as BaseCmsModel, CmsModelField } from "~/types";
import { useQuery } from "~/admin/hooks";
import {
    LIST_REFERENCED_MODELS,
    ListReferencedModelsQueryResult
} from "~/admin/plugins/fields/ref/graphql";
import styled from "@emotion/styled";
import { useSnackbar } from "@webiny/app-admin";

type CmsModel = Pick<BaseCmsModel, "modelId" | "name">;

const Information = styled("div")({
    display: "flex",
    flexDirection: "row",
    justifyContent: "right",
    alignItems: "center",
    flex: "1"
});

const BadgeItem = styled("div")({
    display: "inline-block",
    padding: "5px 20px 7px 20px",
    backgroundColor: "#FFF",
    borderRadius: "5px",
    border: "1px solid darkgrey",
    marginRight: "10px",
    cursor: "default",
    fontWeight: "normal"
});

const Extras = styled("div")({
    display: "inline-block",
    padding: "5px 10px 7px 10px",
    backgroundColor: "#FFF",
    borderRadius: "5px",
    border: "1px solid darkgrey",
    maxWidth: "20px",
    textAlign: "center",
    marginRight: "10px",
    cursor: "default",
    fontWeight: "normal"
});

interface BadgeProps {
    model: CmsModel;
}

const Badge = ({ model }: BadgeProps) => {
    return <BadgeItem>{model.name}</BadgeItem>;
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
        <Information>
            {items.map(model => {
                return <Badge key={`model-${model.modelId}`} model={model} />;
            })}
            {badges > 0 && <Extras>+{badges}</Extras>}
        </Information>
    );
};
