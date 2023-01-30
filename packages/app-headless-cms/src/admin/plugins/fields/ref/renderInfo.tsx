import React, { useEffect, useMemo, useState } from "react";
import { CmsModel, CmsModelField } from "~/types";
import { useQuery } from "~/admin/hooks";
import {
    LIST_REFERENCED_MODELS,
    ListReferencedModelsQueryResult
} from "~/admin/plugins/fields/ref/graphql";
import styled from "@emotion/styled";
import { useSnackbar } from "@webiny/app-admin";

type TinyCmsModel = Pick<CmsModel, "modelId" | "name">;

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
    model: TinyCmsModel;
}
const Badge: React.FC<BadgeProps> = ({ model }) => {
    return <BadgeItem>{model.name}</BadgeItem>;
};

interface Params {
    field: CmsModelField;
    model: TinyCmsModel;
}

const takeBadges = 1;

export const renderInfo = ({ model, field }: Params) => {
    return <RenderInfo model={model} field={field} />;
};

const RenderInfo: React.FC<Params> = ({ field }) => {
    const hasAnyModels = (field.settings?.models || []).length > 0;
    const { data, loading, error } = useQuery<ListReferencedModelsQueryResult>(
        LIST_REFERENCED_MODELS,
        {
            skip: !hasAnyModels
        }
    );

    const { showSnackbar } = useSnackbar();

    const [models, setModels] = useState<TinyCmsModel[]>([]);

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
        return {
            items: models.slice(0, takeBadges),
            badges: models.length - takeBadges
        };
    }, [models]);

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
