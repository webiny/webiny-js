import React, { useState, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS } from "./graphql";
import get from "lodash.get";
import set from "lodash.set";
import cloneDeep from "lodash/cloneDeep";
import createApolloClient from "./createApolloClient";

export const CmsContext = React.createContext({});

const apolloClientsCache = {};

const getCurrentEnvironmentFromLocalStorage = () => {
    try {
        return JSON.parse(get(window, "localStorage.cms_environment"));
    } catch {
        return null;
    }
};

export function CmsProvider(props) {
    const [currentEnvironmentId, setCurrentEnvironmentId] = useState(() => {
        const environment = getCurrentEnvironmentFromLocalStorage();
        return environment && environment.id;
    });

    const [apolloClient, setApolloClient] = useState();

    const environmentsQuery = useQuery(LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS, {
        // TODO: We'll remove this one after fixing "cache structure"
        fetchPolicy: "network-only",
        onCompleted: response => {
            const { data = [] } = get(response, "cms.listEnvironments", {});

            if (currentEnvironmentId) {
                const existingEnvironment = data.find(item => item.id === currentEnvironmentId);
                if (existingEnvironment) {
                    selectEnvironment(existingEnvironment);
                    return;
                }
            }

            // 1. Try to get production environment as the default one.
            // 2. If nothing was found, just use the first one in the list.
            let environmentToSelect = data.find(item => item.isProduction);
            if (!environmentToSelect) {
                environmentToSelect = data[0];
            }
            selectEnvironment(environmentToSelect);
        }
    });

    const environments = cloneDeep(get(environmentsQuery, "data.cms.listEnvironments.data")) || [];
    environments.hash = environments.map(item => item.id).join("-");

    const selectEnvironment = useCallback(environment => {
        set(
            window,
            "localStorage.cms_environment",
            JSON.stringify({
                id: environment.id,
                name: environment.name,
                isProduction: environment.isProduction
            })
        );

        setCurrentEnvironmentId(environment.id);

        if (!apolloClientsCache[environment.id]) {
            apolloClientsCache[environment.id] = createApolloClient({
                uri: `${process.env.REACT_APP_API_URL}/cms/manage/${environment.id}`
            });
        }

        setApolloClient(apolloClientsCache[environment.id]);
    }, []);

    const isSelectedEnvironment = useCallback(
        environment => {
            return environment.id === currentEnvironmentId;
        },
        [currentEnvironmentId]
    );

    const selectAvailableEnvironment = useCallback(
        blacklist => {
            for (let i = 0; i < environments.length; i++) {
                const current = environments[i];
                if (!blacklist.find(item => item.id === current.id)) {
                    selectEnvironment(current);
                    break;
                }
            }
        },
        [currentEnvironmentId, environments.hash]
    );

    const value = {
        environments: {
            apolloClient,
            selectEnvironment,
            isSelectedEnvironment,
            selectAvailableEnvironment,
            environments,
            get currentEnvironment() {
                return environments.find(item => item.id === currentEnvironmentId);
            },
            refreshEnvironments: environmentsQuery.refetch
        }
    };

    return <CmsContext.Provider value={value} {...props} />;
}
