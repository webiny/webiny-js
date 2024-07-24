import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import get from "lodash/get";
import pick from "lodash/pick";
import { ApolloClient } from "apollo-client";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    GET_CONTENT_MODEL,
    GetCmsModelQueryResponse,
    GetCmsModelQueryVariables,
    UPDATE_CONTENT_MODEL,
    UpdateCmsModelMutationResponse,
    UpdateCmsModelMutationVariables
} from "~/admin/graphql/contentModels";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql";
import { CmsModel, CmsModelField } from "~/types";
import { FetchResult } from "apollo-link";
import { ModelProvider } from "~/admin/components/ModelProvider";
import { createHashing } from "@webiny/app/utils";

export interface ContentModelEditorProviderContext {
    apolloClient: ApolloClient<any>;
    data: CmsModel;
    contentModel: CmsModel;
    isPristine: boolean;
    getContentModel: (modelId: string) => Promise<FetchResult<GetCmsModelQueryResponse>>;
    saveContentModel: (
        data?: CmsModel
    ) => Promise<UpdateCmsModelMutationResponse["updateContentModel"]>;
    setData: (setter: (model: CmsModel) => void, saveContentModel?: boolean) => Promise<any>;
    activeTabIndex: number;
    setActiveTabIndex: (index: number) => void;
}

export const contentModelEditorContext = React.createContext<
    ContentModelEditorProviderContext | undefined
>(undefined);

type PickedCmsModel = Pick<
    CmsModel,
    "layout" | "fields" | "name" | "settings" | "description" | "titleFieldId" | "group"
>;
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

/**
 * Cleanup is required because backend always expects string value in predefined values entries
 */
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
    apolloClient: ApolloClient<any>;
    modelId?: string;
    children: React.ReactElement;
}

export const ContentModelEditorProvider = ({
    children,
    apolloClient,
    modelId
}: ContentModelEditorProviderProps) => {
    const [state, dispatch] = useReducer<Reducer>(contentModelEditorReducer, {
        modelId: modelId || null,
        isPristine: true,
        data: null as unknown as CmsModel,
        activeTabIndex: 0
    });

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const setPristine = (flag: boolean): void => {
        dispatch({ type: "state", data: { isPristine: flag } });
    };

    const saveContentModel = async (
        data?: CmsModel
    ): Promise<UpdateCmsModelMutationResponse["updateContentModel"]> => {
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
        const response = await apolloClient.mutate<
            UpdateCmsModelMutationResponse,
            UpdateCmsModelMutationVariables
        >({
            mutation: UPDATE_CONTENT_MODEL,
            variables: {
                modelId: data.modelId,
                data: cleanupModelData(modelData)
            },
            refetchQueries: [
                {
                    query: LIST_MENU_CONTENT_GROUPS_MODELS
                }
            ]
        });

        setPristine(true);

        if (!response.data || !response.data.updateContentModel) {
            return {
                data: null,
                error: null
            };
        }

        return response.data.updateContentModel;
    };

    const setActiveTabIndex = useCallback((activeTabIndex: number) => {
        dispatch({ type: "state", data: { activeTabIndex } });
    }, []);

    /**
     * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
     * Return new data once finished.
     */
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

    const getContentModel = async (
        modelId: string
    ): Promise<FetchResult<GetCmsModelQueryResponse>> => {
        const response = await apolloClient.query<
            GetCmsModelQueryResponse,
            GetCmsModelQueryVariables
        >({
            query: GET_CONTENT_MODEL,
            variables: {
                modelId
            }
        });

        const { data, error } = get(response, "data.getContentModel");
        if (error) {
            throw new Error(error.message);
        }

        await setData(() => data, false);

        setPristine(true);
        return response;
    };

    useEffect(() => {
        if (!modelId) {
            return;
        }
        getContentModel(modelId).catch(() => {
            history.push(`/cms/content-models`);
            showSnackbar(`Could not load content model with given ID.`);
        });
    }, [modelId]);

    const value = useMemo<ContentModelEditorProviderContext>(
        () => ({
            // Keeping `data` for compatibility
            data: state.data,
            contentModel: state.data,
            modelId,
            apolloClient,
            dispatch,
            isPristine: state.isPristine,
            getContentModel,
            saveContentModel,
            setData,
            activeTabIndex: state.activeTabIndex,
            setActiveTabIndex
        }),
        [state, apolloClient]
    );

    const { Provider } = contentModelEditorContext;

    return (
        <Provider value={value}>
            <ModelProvider model={value.contentModel}>{children}</ModelProvider>
        </Provider>
    );
};
