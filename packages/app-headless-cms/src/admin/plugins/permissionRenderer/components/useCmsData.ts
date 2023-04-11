import { useEffect, useReducer } from "react";
import gql from "graphql-tag";
import { useCms } from "../../../hooks";
import { CmsErrorResponse } from "~/types";

export interface CmsDataCmsGroup {
    id: string;
    label: string;
}
export interface CmsDataCmsModel {
    id: string;
    modelId: string;
    label: string;
    group: CmsDataCmsGroup;
}
/**
 * ########################
 * List CMS Models And Groups for Permissions
 */
interface ListCmsPermissionsResponse {
    listContentModels: {
        data: CmsDataCmsModel[];
        error?: CmsErrorResponse;
    };
    listContentModelGroups: {
        data: CmsDataCmsGroup[];
        error?: CmsErrorResponse;
    };
}
const LIST_DATA = gql`
    query CmsLoadPermissionsData {
        listContentModels {
            data {
                modelId
                id: modelId
                label: name
                group {
                    id
                    label: name
                }
            }
            meta {
                totalCount
                cursor
                hasMoreItems
            }
            error {
                code
                message
                data
            }
        }
        listContentModelGroups {
            data {
                id
                label: name
            }
            meta {
                totalCount
                cursor
                hasMoreItems
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export interface UseCmsDataResponseRecords {
    models: CmsDataCmsModel[];
    groups: CmsDataCmsGroup[];
}
interface State {
    [key: string]: UseCmsDataResponseRecords;
}
interface Reducer {
    (prev: State, next: State): State;
}

export interface UseCmsDataResponse {
    [locale: string]: UseCmsDataResponseRecords;
}
export const useCmsData = (locales: string[]): UseCmsDataResponse => {
    const { getApolloClient } = useCms();
    const [state, setState] = useReducer<Reducer>((prev, next) => {
        return {
            ...prev,
            ...next
        };
    }, {});

    const loadData = async () => {
        for (const code of locales) {
            const client = getApolloClient(code);

            if (!state[code]) {
                client.query<ListCmsPermissionsResponse>({ query: LIST_DATA }).then(({ data }) => {
                    setState({
                        [code]: {
                            models: data.listContentModels.data,
                            groups: data.listContentModelGroups.data
                        }
                    });
                });
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [locales.sort().join(":")]);

    return locales.reduce((acc, code) => {
        if (!state[code]) {
            acc[code] = {
                models: [],
                groups: []
            };
            return acc;
        }
        acc[code] = state[code];
        return acc;
    }, {} as UseCmsDataResponse);
};
