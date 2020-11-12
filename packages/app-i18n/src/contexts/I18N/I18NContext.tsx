import React, { useState } from "react";
import { useQuery, QueryResult } from "react-apollo";
import gql from "graphql-tag";

export const GET_I18N_INFORMATION = gql`
    query GetI18NInformation {
        i18n {
            getI18NInformation {
                currentLocales {
                    context
                    locale
                }
                locales {
                    code
                    default
                }
            }
        }
    }
`;

export const I18NContext = React.createContext(null);
const defaultState = { currentLocales: [], locales: [] };

type CurrentLocale = {
    context: string;
    locale: string;
};

type I18NContextState = {
    locales: { code: string; default: boolean }[];
    currentLocales: CurrentLocale[];
};

export type I18NContextValue = {
    refetchLocales(variables?: Record<string, any>): Promise<QueryResult>;
    updateLocaleStorage: (currentLocales: CurrentLocale[]) => void;
    state: I18NContextState;
    setState: typeof useState;
};

export type I18NProviderProps = {
    children?: React.ReactNode;
    loader?: React.ReactElement;
};

const updateLocaleStorage = currentLocales => {
    localStorage.setItem(
        "wby_i18n_locale",
        currentLocales.reduce(
            (current, { context, locale }) => `${current}${context}:${locale};`,
            ""
        )
    );
};

export const I18NProvider = (props: I18NProviderProps) => {
    const { children, loader } = props;
    const [state, setState] = useState<I18NContextState>(defaultState);
    const { loading, refetch } = useQuery(GET_I18N_INFORMATION, {
        onCompleted(data) {
            const { currentLocales: fetchedCurrentLocales, locales } =
                data?.i18n?.getI18NInformation || {};

            // wby_i18n_locale: "default:en-US;content:en-US;"
            const parsedLocales = {};
            if (localStorage.getItem("wby_i18n_locale")) {
                localStorage
                    .getItem("wby_i18n_locale")
                    .split(";")
                    .filter(Boolean)
                    .forEach(item => {
                        const [context, locale] = item.split(":");
                        parsedLocales[context] = locale;
                    });
            }

            const currentLocales = [];
            for (let i = 0; i < fetchedCurrentLocales.length; i++) {
                const item = fetchedCurrentLocales[i];
                currentLocales.push({
                    context: item.context,
                    locale: parsedLocales[item.context] || item.locale
                });
            }

            updateLocaleStorage(currentLocales);
            setState({ locales, currentLocales });
        }
    });

    if (loading && loader) {
        return loader;
    }

    const value = {
        refetchLocales: refetch,
        updateLocaleStorage,
        state,
        setState
    };

    return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
};
