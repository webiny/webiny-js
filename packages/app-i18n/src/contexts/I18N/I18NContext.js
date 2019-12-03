// @flow
// $FlowFixMe
import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { CircularProgress } from "@webiny/ui/Progress";
import get from "lodash.get";

export const getI18NInformation = gql`
    query GetI18NInformation {
        i18n {
            getI18NInformation {
                currentLocale {
                    id
                    code
                }
                locales {
                    id
                    code
                    default
                }
            }
        }
    }
`;

const I18NContext = React.createContext();
const defState = { initializing: false, currentLocale: null, locales: [] };

const I18NProvider = ({ children }: Object) => {
    const { loading, data, refetch } = useQuery(getI18NInformation);

    if (loading) {
        return <CircularProgress label={"Loading locales..."} />;
    }

    const { currentLocale, locales } = get(data, "i18n.getI18NInformation", {});

    const value = {
        refetchLocales: refetch,
        state: {
            ...defState,
            currentLocale,
            locales
        }
    };

    return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
};

export { I18NProvider, I18NContext };
