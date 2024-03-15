import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n";
import { getToken } from "./utils/getToken";
import { getUrl } from "./utils/getUrl";
import { IncomingGenericData, IWebsocketsContext, IWebsocketsContextSendCallable } from "~/types";
import {
    createWebsocketsAction,
    createWebsocketsActions,
    createWebsocketsBlackHoleManager,
    createWebsocketsConnection,
    createWebsocketsManager,
    createWebsocketsSubscriptionManager
} from "./domain";
import { IGenericData, IWebsocketsManager } from "./domain/types";

export interface IWebsocketsProviderProps {
    children: React.ReactNode;
}

export const WebsocketsContext = React.createContext<IWebsocketsContext>(
    {} as unknown as IWebsocketsContext
);

interface ICurrentData {
    tenant?: string;
    locale?: string;
}

export const WebsocketsProvider = (props: IWebsocketsProviderProps) => {
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const locale = getCurrentLocale("default");

    const socketsRef = useRef<IWebsocketsManager>(createWebsocketsBlackHoleManager());

    const [current, setCurrent] = useState<ICurrentData>({});

    const subscriptionManager = useMemo(() => {
        return createWebsocketsSubscriptionManager();
    }, []);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (!token || !tenant || !locale) {
                return;
            } else if (current.tenant === tenant && current.locale === locale) {
                return;
            } else if (socketsRef.current) {
                socketsRef.current.close();
            }
            const url = getUrl({ tenant, locale, token });

            if (!url) {
                console.error("Not possible to connect to the websocket without a valid URL.", {
                    tenant,
                    locale,
                    token
                });
                return;
            }

            setCurrent({
                tenant,
                locale
            });

            socketsRef.current = createWebsocketsManager(
                createWebsocketsConnection({
                    subscriptionManager,
                    url,
                    protocol: ["webiny-ws-v1"]
                })
            );
            socketsRef.current.connect();
        })();
    }, [tenant, locale, subscriptionManager]);

    const websocketActions = useMemo(() => {
        return createWebsocketsActions({
            manager: socketsRef.current,
            tenant,
            locale,
            getToken
        });
    }, [socketsRef.current, tenant, locale]);

    const send = useCallback<IWebsocketsContextSendCallable>(
        async (action, data, timeout) => {
            return websocketActions.run({
                action,
                data,
                timeout
            });
        },
        [websocketActions]
    );

    const createAction = useCallback(
        <T extends IGenericData = IGenericData, R extends IGenericData = IGenericData>(
            name: string
        ) => {
            return createWebsocketsAction<T, R>(websocketActions, name);
        },
        [websocketActions]
    );

    const onMessage = useCallback(
        <T extends IncomingGenericData = IncomingGenericData>(
            action: string,
            cb: (data: T) => void
        ) => {
            return socketsRef.current.onMessage<T>(async event => {
                if (event.data.action !== action) {
                    return;
                }
                cb(event.data);
            });
        },
        [socketsRef.current]
    );

    // TODO remove when finished with development
    (window as any).webinySockets = socketsRef.current;
    (window as any).send = send;
    (window as any).createAction = createAction;
    (window as any).onMessage = onMessage;

    const value: IWebsocketsContext = {
        send,
        createAction,
        onMessage
    };
    return <WebsocketsContext.Provider value={value} {...props} />;
};
