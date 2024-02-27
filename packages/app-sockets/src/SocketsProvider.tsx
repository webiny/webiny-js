import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import { WebsocketManager } from "./sockets/WebsocketManager";
import { BlackHoleWebsocketManager } from "./sockets/BlackHoleWebsocketManager";
import { IWebsocketManager } from "./sockets/abstractions/IWebsocketManager";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n";
import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import { WebsocketConnection } from "~/sockets/WebsocketConnection";
import { WebsocketSubscriptionManager } from "~/sockets/WebsocketSubscriptionManager";
import { WebsocketActions } from "~/sockets/WebsocketActions";

interface GetUrlParams {
    tenant: string;
    locale: string;
    token: string;
}

const getUrl = (params: GetUrlParams): string | undefined => {
    const { tenant, locale, token } = params;
    if (!token) {
        console.log("Missing a token to connect to the websocket.");
        return;
    } else if (!tenant) {
        console.log("Missing a tenant to connect to the websocket.");
        return;
    } else if (!locale) {
        console.log("Missing a locale to connect to the websocket.");
        return;
    }
    const websocketApiUrl = process.env.REACT_APP_WEBSOCKET_URL;

    const url = !websocketApiUrl || websocketApiUrl === "undefined" ? undefined : websocketApiUrl;
    if (!url) {
        console.error("Missing REACT_APP_WEBSOCKET_URL environment variable.");
        return;
    }

    return `${url}?token=${token}&tenant=${tenant}&locale=${locale}`;
};

export interface ISocketsContextSendCallable {
    <T extends IGenericData = IGenericData>(action: string, data?: T, timeout?: number): void;
}

export interface ISocketsContext {
    send: ISocketsContextSendCallable;
}

export const SocketsContext = React.createContext<ISocketsContext>(
    {} as unknown as ISocketsContext
);

export interface ISocketsProviderProps {
    children: React.ReactNode;
}

const getToken = async (): Promise<string | null> => {
    const user = await Auth.currentSession();
    if (!user) {
        return null;
    }
    const token = user.getIdToken();
    if (!token) {
        return null;
    }
    return token.getJwtToken();
};

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

            socketsRef.current = new WebsocketManager(
                new WebsocketConnection({
                    subscriptionManager: new WebsocketSubscriptionManager(),
                    url,
                    protocol: ["webiny-ws-v1"]
                })
            );
            socketsRef.current.connect();
        })();
    }, [tenant, locale]);

    const websocketActions = useMemo(() => {
        return new WebsocketActions({
            manager: socketsRef.current,
            tenant,
            locale,
            getToken
        });
    }, [socketsRef.current, tenant, locale]);

    const send = useCallback<ISocketsContextSendCallable>(
        async (action, data, timeout) => {
            return websocketActions.action(action, data, timeout);
        },
        [websocketActions]
    );

    // TODO remove when finished with development
    (window as any).webinySockets = socketsRef.current;
    (window as any).send = send;

    const value: ISocketsContext = {
        send
    };
    return <SocketsContext.Provider value={value} {...props} />;
};
