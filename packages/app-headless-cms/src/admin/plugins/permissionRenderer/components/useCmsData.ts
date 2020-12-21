import { useEffect, useReducer } from "react";
import gql from "graphql-tag";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

const LIST_DATA = gql`
    query CmsLoadPermissionsData {
        listContentModels {
            data {
                id: modelId
                label: name
            }
        }
        listContentModelGroups {
            data {
                id
                label: name
            }
        }
    }
`;

export const useCmsData = (locales: string[]) => {
    const { getApolloClient } = useCms();
    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {});

    const loadData = async () => {
        for (let i = 0; i < locales.length; i++) {
            const code = locales[i];

            const client = getApolloClient(code);

            if (!state[code]) {
                client.query({ query: LIST_DATA }).then(({ data }) => {
                    const models = data.listContentModels.data;
                    const groups = data.listContentModelGroups.data;
                    setState({ ...state, [code]: { models, groups } });
                });
            }
        }
    };
    
    useEffect(() => {
        loadData();
    }, [locales.sort().join(":")]);
    
    return locales.reduce((acc, code) => {
        acc[code] = state[code] || { models: [], groups: [] };
        return acc;
    }, {});
};
