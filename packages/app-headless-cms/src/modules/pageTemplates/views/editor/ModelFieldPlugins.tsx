import React, { useState } from "react";
import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import { useQuery } from "~/admin/hooks";
import { LIST_CONTENT_MODELS, ListCmsModelsQueryResponse } from "~/admin/viewsGraphql";
import { CmsEditorFieldTypePlugin, CmsModel } from "~/types";
import { ReactComponent as ObjectIcon } from "~/admin/icons/ballot_black_24dp.svg";

const isContentModel = (model: CmsModel) => {
    return model.tags.some(tag => tag === "type:contentModel");
};

export const ModelFieldPlugins: React.FC = ({ children }) => {
    const [loaded, setLoaded] = useState(false);

    useQuery<ListCmsModelsQueryResponse>(LIST_CONTENT_MODELS, {
        onCompleted(data) {
            const contentModels = data.listContentModels.data;
            const fieldPlugins = contentModels
                .filter(isContentModel)
                .map<CmsEditorFieldTypePlugin>(model => {
                    return {
                        type: "cms-editor-field-type",
                        name: `cms-editor-field-type-${model.modelId}`,
                        field: {
                            type: `model-${model.modelId}`,
                            icon: <ObjectIcon />,
                            label: model.name,
                            allowPredefinedValues: false,
                            description: model.description || "",
                            allowMultipleValues: true,
                            multipleValuesLabel: "",
                            createField: () => ({
                                type: `model-${model.modelId}`,
                                validation: [],
                                renderer: {
                                    name: "model-renderer"
                                }
                            })
                        },
                        tags: ["content-model", ...(model.tags || [])]
                    };
                });

            plugins.register(fieldPlugins);
            setLoaded(true);
        }
    });

    return loaded ? <>{children}</> : <CircularProgress label={"Loading page template..."} />;
};
