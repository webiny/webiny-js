import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n";
import { getToken } from "./utils/getToken";
import {
    IncomingGenericData,
    IWebsocketsContext,
    IWebsocketsContextSendCallable,
    WebsocketsCloseCode
} from "~/types";
import {
    createWebsocketsAction,
    createWebsocketsActions,
    createWebsocketsConnection,
    createWebsocketsManager,
    createWebsocketsSubscriptionManager
} from "./domain";
import { IGenericData, IWebsocketsManager } from "./domain/types";
import { getUrl } from "./utils/getUrl";

export interface IWebsocketsContextProviderProps {
    loader?: React.ReactElement;
    children: React.ReactNode;
}

export const WebsocketsContext = React.createContext<IWebsocketsContext>(
    undefined as unknown as IWebsocketsContext
);

interface ICurrentData {
    tenant?: string;
    locale?: string;
}

export const WebsocketsContextProvider = (props: IWebsocketsContextProviderProps) => {
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const locale = getCurrentLocale("default");

    const socketsRef = useRef<IWebsocketsManager>();

    const [current, setCurrent] = useState<ICurrentData>({});

    const subscriptionManager = useMemo(() => {
        const manager = createWebsocketsSubscriptionManager();

        let currentIteration = 0;
        manager.onClose(event => {
            if (currentIteration > 5 || event.code !== WebsocketsCloseCode.GOING_AWAY) {
                return;
            }
            currentIteration++;
            setTimeout(() => {
                if (!socketsRef.current) {
                    return;
                } else if (socketsRef.current.isClosed()) {
                    console.log("Running auto-reconnect.");

                    socketsRef.current.connect();
                }
            }, 1000);
        });

        return manager;
    }, []);
    /**
     * We need this useEffect to close the websocket connection and remove window focus event in case component is unmounted.
     * This will, probably, happen only during the development phase.
     *
     * If we did not disconnect on component unmount, we would have a memory leak - multiple connections would be opened.
     */
    useEffect(() => {
        /**
         * We want to add a window event listener which will check if the connection is closed, and if its - it will connect again.
         */
        const fn = () => {
            if (!socketsRef.current) {
                return;
            } else if (socketsRef.current.isClosed()) {
                console.log("Running auto-reconnect on focus.");
                socketsRef.current.connect();
            }
        };
        window.addEventListener("focus", fn);

        return () => {
            window.removeEventListener("focus", fn);
            // if (!socketsRef.current) {
            //     return;
            // }

            // socketsRef.current.close(WebsocketsCloseCode.NORMAL, "Component unmounted.");
        };
    }, []);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (!token || !tenant || !locale) {
                return;
            } else if (current.tenant === tenant && current.locale === locale) {
                return;
            } else if (socketsRef.current) {
                await socketsRef.current.close(
                    WebsocketsCloseCode.NORMAL,
                    "Changing tenant/locale."
                );
            }
            const url = getUrl();

            if (!url) {
                console.error("Not possible to connect to the websocket without a valid URL.", {
                    tenant,
                    locale,
                    token
                });
                return;
            }

            socketsRef.current = createWebsocketsManager(
                createWebsocketsConnection({
                    subscriptionManager,
                    url,
                    tenant,
                    locale,
                    getToken,
                    protocol: ["webiny-ws-v1"]
                })
            );
            await socketsRef.current.connect();

            setCurrent({
                tenant,
                locale
            });
        })();
    }, [tenant, locale, subscriptionManager]);

    const websocketActions = useMemo(() => {
        return createWebsocketsActions({
            manager: socketsRef.current!,
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
            return socketsRef.current!.onMessage<T>(async event => {
                if (event.data.action !== action) {
                    return;
                }
                cb(event.data);
            });
        },
        [socketsRef.current]
    );

    if (!socketsRef.current) {
        return props.loader || null;
    }

    const value: IWebsocketsContext = {
        send,
        createAction,
        onMessage
    };
    return <WebsocketsContext.Provider value={value} {...props} />;
};
