import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import pick from "lodash/pick.js";
import { useSnackbar, useRouter } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { CmsModel, CmsModelField } from "~/types.js";
import { useContainer } from "@webiny/app";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { createHashing } from "@webiny/app/utils/index.js";
import { Routes } from "~/routes.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";
import {
    buildFieldOptions,
    buildFieldLabelPrefixes
} from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";
import { CmsLayoutFieldType } from "~/presentation/fieldTypes/abstractions.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import { UpdateModelFeature } from "~/features/model/updateModel/feature.js";

type PickedCmsModel = Pick<
    CmsModel,
    | "layout"
    | "fields"
    | "name"
    | "settings"
    | "description"
    | "titleFieldId"
    | "descriptionFieldId"
    | "imageFieldId"
    | "group"
    | "tags"
    | "icon"
>;

export interface ContentModelEditorProviderContext {
    data: CmsModel;
    contentModel: CmsModel;
    isPristine: boolean;
    getContentModel: (modelId: string) => Promise<void>;
    saveContentModel: (data?: CmsModel) => Promise<{ data: CmsModel | null; error: any | null }>;
    setData: (setter: (model: CmsModel) => void, saveContentModel?: boolean) => Promise<any>;
    activeTabIndex: number;
    setActiveTabIndex: (index: number) => void;
    fieldOptions: FieldOption[];
}

export const contentModelEditorContext = React.createContext<
    ContentModelEditorProviderContext | undefined
>(undefined);

interface State {
    modelId: string | null;
    isPristine: boolean;
    data: CmsModel;
    activeTabIndex: number;
}
interface Action {
    data: Partial<State> | Partial<CmsModel>;
    type: "state" | "data";
}
interface Reducer {
    (prev: State, action: Action): State;
}
export const contentModelEditorReducer: Reducer = (prev: State, action: Action): State => {
    const { data, type } = action;
    switch (type) {
        case "state":
            return { ...prev, ...data };

        case "data":
            return { ...prev, data: data as CmsModel };
        default:
            return prev;
    }
};

const hashModel = createHashing("SHA-256");

const cleanupModelDataFields = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        const { predefinedValues } = field;
        const { enabled = false, values = [] } = predefinedValues || {};
        return {
            ...field,
            predefinedValues: {
                enabled,
                values: values.map(({ label, value, selected }) => {
                    return {
                        label,
                        selected: selected || false,
                        value: String(value)
                    };
                })
            }
        };
    });
};

const cleanupModelData = (data: PickedCmsModel): PickedCmsModel => {
    return {
        ...data,
        fields: cleanupModelDataFields(data.fields)
    };
};

interface ContentModelEditorProviderProps {
    modelId?: string;
    children: React.ReactElement;
}

const createDefaultState = (modelId?: string): State => {
    return {
        modelId: modelId || null,
        isPristine: true,
        data: null as unknown as CmsModel,
        activeTabIndex: 0
    };
};

export const ContentModelEditorProvider = ({
    children,
    modelId
}: ContentModelEditorProviderProps) => {
    const { useCase: getModelUseCase } = useFeature(GetModelFeature);
    const { useCase: updateModelUseCase } = useFeature(UpdateModelFeature);

    const [state, dispatch] = useReducer(contentModelEditorReducer, createDefaultState(modelId));

    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();

    const setPristine = (flag: boolean): void => {
        dispatch({ type: "state", data: { isPristine: flag } });
    };

    const saveContentModel = async (
        data?: CmsModel
    ): Promise<{ data: CmsModel | null; error: any | null }> => {
        if (!data) {
            data = state.data;
        }
        const modelData: PickedCmsModel = pick(data, [
            "group",
            "layout",
            "fields",
            "tags",
            "name",
            "settings",
            "description",
            "titleFieldId",
            "descriptionFieldId",
            "imageFieldId",
            "icon"
        ]);

        try {
            const result = await updateModelUseCase.execute({
                modelId: data.modelId,
                data: cleanupModelData(modelData)
            });

            setPristine(true);

            return {
                data: result,
                error: null
            };
        } catch (ex: any) {
            return {
                data: null,
                error: { message: ex.message }
            };
        }
    };

    const setActiveTabIndex = useCallback((activeTabIndex: number) => {
        dispatch({ type: "state", data: { activeTabIndex } });
    }, []);

    const setData = async (setter: (value: any) => any, saveModel = false): Promise<void> => {
        const data = setter(state.data);
        const existingHash = await hashModel(state.data);
        const newHash = await hashModel(data);
        if (existingHash === newHash) {
            return;
        }
        setPristine(false);
        dispatch({ type: "data", data });
        if (!saveModel) {
            return;
        }
        await saveContentModel(data);
    };

    const getContentModel = async (id: string): Promise<void> => {
        const data = await getModelUseCase.execute({ modelId: id });
        await setData(() => data, false);
        setPristine(true);
    };

    useEffect(() => {
        if (!modelId) {
            return;
        }
        getContentModel(modelId).catch(() => {
            goToRoute(Routes.ContentModels.List);
            showSnackbar(`Could not load content model with given ID.`);
        });
    }, [modelId]);

    const container = useContainer();
    const layoutFieldTypes = useMemo(() => {
        return container.resolveAll(CmsLayoutFieldType);
    }, [container]);

    const fieldOptions = useMemo(() => {
        const model = state.data;
        if (!model) {
            return [];
        }
        const prefixes = model.layout
            ? buildFieldLabelPrefixes(model.layout, layoutFieldTypes)
            : undefined;
        return buildFieldOptions(model.fields ?? [], "", "", prefixes, layoutFieldTypes);
    }, [state.data?.fields, state.data?.layout]);

    const value = useMemo<ContentModelEditorProviderContext>(
        () => ({
            data: state.data,
            contentModel: state.data,
            isPristine: state.isPristine,
            getContentModel,
            saveContentModel,
            setData,
            activeTabIndex: state.activeTabIndex,
            setActiveTabIndex,
            fieldOptions
        }),
        [state, fieldOptions]
    );

    const { Provider } = contentModelEditorContext;

    return (
        <Provider value={value}>
            <ModelProvider model={value.contentModel}>{children}</ModelProvider>
        </Provider>
    );
};
