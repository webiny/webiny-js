// @flow
// $FlowFixMe
import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { CircularProgress } from "@webiny/ui/Progress";

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
    const { loading, data } = useQuery(getI18NInformation);

    if (loading) {
        return <CircularProgress />;
    }

    const { currentLocale, locales } = data.i18n.getI18NInformation;

    const value = {
        state: {
            ...defState,
            currentLocale,
            locales
        }
    };

    return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
};

export { I18NProvider, I18NContext };
