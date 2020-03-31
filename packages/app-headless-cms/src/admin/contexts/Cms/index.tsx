import React, { useState, useCallback } from "react";
import { useQuery } from "react-apollo";
import { LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS } from "./graphql";
import get from "lodash.get";
import set from "lodash.set";
import createApolloClient from "./createApolloClient";

export const CmsContext = React.createContext({});

const apolloClientsCache = {};

export function CmsProvider(props) {
    const [currentEnvironment, setCurrentEnvironment] = useState(() => {
        try {
            return JSON.parse(get(window, "localStorage.cms_environment"));
        } catch {
            return null;
        }
    });

    const [apolloClient, setApolloClient] = useState();

    const environmentsQuery = useQuery(LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS, {
        onCompleted: response => {
            const { data = [] } = get(response, "cms.listEnvironments", {});

            if (currentEnvironment) {
                const existingEnvironment = data.find(item => item.id === currentEnvironment.id);
                if (existingEnvironment) {
                    selectEnvironment(existingEnvironment);
                    return;
                }
            }

            // 1. Try to get production environment as the default one.
            // 2. If nothing was found, just use the first one in the list.
            let defaultEnvironment = data.find(item => item.isProduction);
            if (!defaultEnvironment) {
                defaultEnvironment = data[0];
            }
            selectEnvironment(defaultEnvironment);
        }
    });

    const selectEnvironment = useCallback(environment => {
        set(
            window,
            "localStorage.cms_environment",
            JSON.stringify({ id: environment.id, name: environment.name })
        );

        setCurrentEnvironment(environment);

        if (!apolloClientsCache[environment.id]) {
            apolloClientsCache[environment.id] = createApolloClient({
                uri: `${process.env.REACT_APP_API_URL}/cms/manage/${environment.id}`
            });
        }

        setApolloClient(apolloClientsCache[environment.id]);
    }, []);

    const value = {
        environments: {
            apolloClient,
            selectEnvironment,
            environments: get(environmentsQuery, "data.cms.listEnvironments.data") || [],
            currentEnvironment,
            refreshEnvironments: async () => {
                const response = await environmentsQuery.refetch();
                const { data = [] } = get(response, "data.cms.listEnvironments", {});
                if (!data.find(item => item.id === currentEnvironment.id)) {
                    return selectEnvironment(data.find(item => item.default));
                }
            }
        }
    };

    return <CmsContext.Provider value={value} {...props} />;
}
