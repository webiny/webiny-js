import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n";
import { getToken } from "./utils/getToken";
import { getUrl } from "./utils/getUrl";
import { IncomingGenericData, ISocketsContext, ISocketsContextSendCallable } from "~/types";
import {
    BlackHoleWebsocketManager,
    createWebsocketAction,
    createWebsocketActions,
    createWebsocketConnection,
    createWebsocketManager,
    createWebsocketSubscriptionManager,
    IGenericData,
    IWebsocketManager
} from "./sockets";

export interface ISocketsProviderProps {
    children: React.ReactNode;
}

export const SocketsContext = React.createContext<ISocketsContext>(
    {} as unknown as ISocketsContext
);

interface ICurrentData {
    tenant?: string;
    locale?: string;
}

export const SocketsProvider = (props: ISocketsProviderProps) => {
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const locale = getCurrentLocale("default");

    const socketsRef = useRef<IWebsocketManager>(new BlackHoleWebsocketManager());

    const [current, setCurrent] = useState<ICurrentData>({});

    const subscriptionManager = useMemo(() => {
        return createWebsocketSubscriptionManager();
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

            socketsRef.current = createWebsocketManager(
                createWebsocketConnection({
                    subscriptionManager,
                    url,
                    protocol: ["webiny-ws-v1"]
                })
            );
            socketsRef.current.connect();
        })();
    }, [tenant, locale, subscriptionManager]);

    const websocketActions = useMemo(() => {
        return createWebsocketActions({
            manager: socketsRef.current,
            tenant,
            locale,
            getToken
        });
    }, [socketsRef.current, tenant, locale]);

    const send = useCallback<ISocketsContextSendCallable>(
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
            return createWebsocketAction<T, R>(websocketActions, name);
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

    const value: ISocketsContext = {
        send,
        createAction,
        onMessage
    };
    return <SocketsContext.Provider value={value} {...props} />;
};
