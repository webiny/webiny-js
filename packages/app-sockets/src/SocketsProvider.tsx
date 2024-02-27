import React, { useCallback, useEffect, useRef, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import { WebsocketManager } from "./sockets/WebsocketManager";
import { BlackHoleWebsocketManager } from "./sockets/BlackHoleWebsocketManager";
import { IWebsocketManager } from "./sockets/abstractions/IWebsocketManager";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n";
import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import { WebsocketConnection } from "~/sockets/WebsocketConnection";
import { WebsocketSubscriptionManager } from "~/sockets/WebsocketSubscriptionManager";

const defaultUrl = "wss://0ptk9t6akg.execute-api.eu-central-1.amazonaws.com/dev";

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
    const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL;

    const url = !websocketUrl || websocketUrl === "undefined" ? defaultUrl : websocketUrl;

    return `${url}?token=${token}tenant=${tenant}&locale=${locale}`;
};

export interface ISocketsContext {
    send: <T extends IGenericData = IGenericData>(data: T) => void;
}

export const SocketsContext = React.createContext<ISocketsContext>(
    {} as unknown as ISocketsContext
);

export interface ISocketsProviderProps {
    children: React.ReactNode;
}

export const SocketsProvider = (props: ISocketsProviderProps) => {
    const [token, setToken] = useState<string | null>(null);

    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const locale = getCurrentLocale("default");

    const socketsRef = useRef<IWebsocketManager>(new BlackHoleWebsocketManager());

    useEffect(() => {
        if (!token || !tenant || !locale) {
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

        const manager = new WebsocketManager(
            new WebsocketConnection({
                subscriptionManager: new WebsocketSubscriptionManager(),
                url
            })
        );

        manager.connect();
        socketsRef.current = manager;
    }, [tenant, locale, token]);

    // TODO remove when finished with development
    (window as any).webinySockets = socketsRef.current;

    useEffect(() => {
        (async () => {
            const user = await Auth.currentSession();
            const idToken = user.getIdToken();
            setToken(idToken.getJwtToken());
        })();
    }, []);

    const send = useCallback(
        (data: IGenericData) => {
            if (!token || !tenant || !locale) {
                console.error("Not possible to send a message without a token, tenant or locale.", {
                    token,
                    tenant,
                    locale
                });
                return;
            }
            socketsRef.current.send({
                ...data,
                token,
                tenant,
                locale
            });
        },
        [socketsRef.current, token, tenant, locale]
    );

    const value: ISocketsContext = {
        send
    };
    return <SocketsContext.Provider value={value} {...props} />;
};
