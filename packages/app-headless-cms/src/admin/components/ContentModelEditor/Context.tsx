// TODO @ts-refactor verify that types are correct
import React, { useEffect, useMemo, useReducer } from "react";
import get from "lodash/get";
import pick from "lodash/pick";
import { ApolloClient } from "apollo-client";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_CONTENT_MODEL, UPDATE_CONTENT_MODEL } from "~/admin/graphql/contentModels";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql";
import { CmsEditorContentModel, CmsEditorField, CmsModel } from "~/types";

export interface Context {
    apolloClient: ApolloClient<any>;
    data: CmsEditorContentModel;
    isPristine: boolean;
    getContentModel: (modelId: string) => Promise<any>;
    saveContentModel: (data?: Record<string, any>) => Promise<any>;
    setData: (setter: (model: CmsModel) => void, saveContentModel?: boolean) => Promise<any>;
}

export const contentModelEditorContext = React.createContext<Context>(null);

type PickedCmsEditorContentModel = Pick<
    CmsEditorContentModel,
    "layout" | "fields" | "name" | "settings" | "description" | "titleFieldId" | "group"
>;
interface State {
    modelId: string;
    isPristine: boolean;
    data: CmsModel;
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
    }
    return prev;
};

/**
 * Cleanup is required because backend always expects string value in predefined values entries
 */
const cleanupModelDataFields = (fields: CmsEditorField[]): CmsEditorField[] => {
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

const cleanupModelData = (data: PickedCmsEditorContentModel): PickedCmsEditorContentModel => {
    return {
        ...data,
        fields: cleanupModelDataFields(data.fields)
    };
};

interface ContentModelEditorProviderProps {
    apolloClient: ApolloClient<any>;
    modelId: string;
    children: React.ReactElement;
}

export const ContentModelEditorProvider: React.FC<ContentModelEditorProviderProps> = ({
    children,
    apolloClient,
    modelId
}) => {
    const [state, dispatch] = useReducer<Reducer>(contentModelEditorReducer, {
        modelId,
        isPristine: true,
        // TODO @ts-refactor figure out if possible not to cast
        data: {} as CmsModel
    });
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const setPristine = (flag: boolean): void => {
        dispatch({ type: "state", data: { isPristine: flag } });
    };

    const saveContentModel = async (data?: CmsModel) => {
        const modelData: PickedCmsEditorContentModel = pick(data || state.data, [
            "group",
            "layout",
            "fields",
            "name",
            "settings",
            "description",
            "titleFieldId"
        ]);
        const response = await apolloClient.mutate({
            mutation: UPDATE_CONTENT_MODEL,
            variables: {
                modelId: data.modelId,
                data: cleanupModelData(modelData)
            },
            refetchQueries: [{ query: LIST_MENU_CONTENT_GROUPS_MODELS }]
        });

        setPristine(true);

        return get(response, "data.updateContentModel");
    };

    /**
     * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
     * Return new data once finished.
     */
    const setData = (setter: (value: any) => any, saveModel = false) => {
        setPristine(false);
        const data = setter(state.data);
        dispatch({ type: "data", data });
        return saveModel !== false && saveContentModel(data);
    };

    const getContentModel = async (modelId: string) => {
        const response = await apolloClient.query({
            query: GET_CONTENT_MODEL,
            variables: { modelId }
        });

        const { data, error } = get(response, "data.getContentModel");
        if (error) {
            throw new Error(error);
        }

        setData(() => {
            setPristine(true);
            return data;
        }, false);
        return response;
    };

    useEffect(() => {
        getContentModel(modelId).catch(() => {
            history.push(`/cms/content-models`);
            showSnackbar(`Could not load content model with given ID.`);
        });
    }, [modelId]);

    const value = useMemo(
        () => ({
            data: state.data,
            modelId,
            apolloClient,
            dispatch,
            isPristine: state.isPristine,
            getContentModel,
            saveContentModel,
            setData
        }),
        [state, apolloClient]
    );

    const { Provider } = contentModelEditorContext;

    return <Provider value={value}>{children}</Provider>;
};
