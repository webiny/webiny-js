import React, { useState, memo, useMemo, useCallback } from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { LocalStorageProvider } from "@webiny/app";
import { useLocalStorage } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { GetI18NInformationResponse, I18NCurrentLocaleItem, I18NLocaleItem } from "~/types";
import { createApolloLinkPlugin } from "~/admin/plugins/apolloLink.js";

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

export interface I18NContextState {
    locales: I18NLocaleItem[];
    currentLocales: I18NCurrentLocaleItem[];
}

export interface I18NContextValue {
    refetchLocales(variables?: Record<string, any>): Promise<any>;

    updateLocaleStorage: (currentLocales: I18NCurrentLocaleItem[]) => void;
    state: I18NContextState;
    setState: (state: Partial<I18NContextState>) => void;
}

export interface I18NProviderProps {
    loader?: React.ReactElement;
    children: React.ReactNode;
}

export const I18NContext = React.createContext<I18NContextValue>({
    state: {
        locales: [],
        currentLocales: []
    },
    setState: () => {
        return void 0;
    },
    refetchLocales: async () => {
        return null;
    },
    updateLocaleStorage: () => {
        return void 0;
    }
});

const defaultState: I18NContextState = { currentLocales: [], locales: [] };

const I18NProviderComponent = (props: I18NProviderProps) => {
    const { localStorage } = useLocalStorage();
    const { children, loader } = props;
    const [state, setState] = useState<I18NContextState>(defaultState);

    const updateLocaleStorage = useCallback(
        (currentLocales: I18NCurrentLocaleItem[]) => {
            localStorage.set(
                "i18n_locale",
                currentLocales.reduce(
                    (current, { context, locale }) => `${current}${context}:${locale};`,
                    ""
                )
            );
        },
        [localStorage]
    );

    const { loading, refetch } = useQuery<GetI18NInformationResponse>(GET_I18N_INFORMATION, {
        skip: state.locales.length > 0,
        onCompleted(data) {
            const { currentLocales: fetchedCurrentLocales, locales } =
                data?.i18n?.getI18NInformation || {};

            // "default:en-US;content:en-US;"
            const parsedLocales: Record<string, string> = {};
            const webinyI18NLocale = localStorage.get("i18n_locale");
            if (webinyI18NLocale) {
                webinyI18NLocale
                    .split(";")
                    .filter(Boolean)
                    .forEach(item => {
                        const [context, locale] = item.split(":");
                        parsedLocales[context] = locale;
                    });
            }

            const currentLocales: I18NCurrentLocaleItem[] = fetchedCurrentLocales.map(item => {
                return {
                    context: item.context,
                    locale: parsedLocales[item.context] || item.locale
                };
            });
            updateLocaleStorage(currentLocales);

            plugins.register(createApolloLinkPlugin(() => webinyI18NLocale));

            setState({ locales, currentLocales });
        }
    });

    const getContentLocale = () => {
        const locale = state.currentLocales.find(locale => locale.context === "content");
        if (!locale) {
            return undefined;
        }
        return locale.locale;
    };

    if (loading && loader) {
        return loader;
    }

    const value = useMemo(
        (): I18NContextValue => ({
            refetchLocales: refetch,
            updateLocaleStorage,
            state,
            setState: (newState: Partial<I18NContextState>) => {
                return setState(prev => {
                    return {
                        ...prev,
                        ...newState
                    };
                });
            }
        }),
        [state]
    );

    return (
        <I18NContext.Provider value={value}>
            <LocalStorageProvider prefix={getContentLocale()}>{children}</LocalStorageProvider>
        </I18NContext.Provider>
    );
};

export const I18NProvider: React.ComponentType<I18NProviderProps> = memo(I18NProviderComponent);
