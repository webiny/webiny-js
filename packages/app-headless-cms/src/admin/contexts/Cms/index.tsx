import React, { useState, useCallback, useContext } from "react";
import { useQuery } from "react-apollo";
import { LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS } from "./graphql";
import get from "lodash.get";
import set from "lodash.set";

const CmsContext = React.createContext({});

export function CmsProvider(props) {
    const [currentEnvironment, setCurrentEnvironment] = useState(() => {
        try {
            return JSON.parse(get(window, "localStorage.cms_environment"));
        } catch {
            return null;
        }
    });

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

            selectEnvironment(data.find(item => item.default));
        }
    });

    const selectEnvironment = useCallback(item => {
        set(
            window,
            "localStorage.cms_environment",
            JSON.stringify({ id: item.id, name: item.name })
        );
        setCurrentEnvironment(item);
    }, []);

    const value = {
        environments: {
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

export const useCms = () => {
    const context = useContext<any>(CmsContext);
    if (!context) {
        throw new Error("useCms must be used within a CmsProvider");
    }

    return context;
};
