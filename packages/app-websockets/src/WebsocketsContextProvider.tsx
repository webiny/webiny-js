import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeature, useTenancy } from "@webiny/app-admin";
import { AuthenticationContextFeature } from "@webiny/app-admin/features/security/AuthenticationContext/feature.js";
import type {
    IncomingGenericData,
    IWebsocketsContext,
    IWebsocketsContextSendCallable,
    IWebsocketsManagerCloseEvent,
    IWebsocketsManagerErrorEvent
} from "~/types.js";
import { WebsocketsCloseCode } from "~/types.js";
import {
    createWebsocketsAction,
    createWebsocketsActions,
    createWebsocketsConnection,
    createWebsocketsManager,
    createWebsocketsSubscriptionManager
} from "./domain/index.js";
import type { IGenericData, IWebsocketsManager } from "./domain/types.js";
import { getUrl } from "./utils/getUrl.js";

export interface IWebsocketsContextProviderProps {
    loader?: React.ReactElement;
    children: React.ReactNode;
}

export const WebsocketsContext = React.createContext<IWebsocketsContext>(
    undefined as unknown as IWebsocketsContext
);

interface ICurrentData {
    tenant?: string;
}

export const WebsocketsContextProvider = (props: IWebsocketsContextProviderProps) => {
    const { tenant } = useTenancy();
    const { authenticationContext } = useFeature(AuthenticationContextFeature);

    const socketsRef = useRef<IWebsocketsManager>();

    const [current, setCurrent] = useState<ICurrentData>({});

    const getToken = useCallback(async () => {
        return await authenticationContext.getIdToken();
    }, [authenticationContext]);

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
        const abortController = new AbortController();

        window.addEventListener(
            "focus",
            () => {
                if (!socketsRef.current) {
                    return;
                } else if (socketsRef.current.isClosed()) {
                    console.log("Running auto-reconnect on focus.");
                    socketsRef.current.connect();
                }
            },
            { signal: abortController.signal }
        );
        window.addEventListener(
            "close",
            () => {
                subscriptionManager.triggerOnClose(
                    new CloseEvent("windowClose", {
                        code: WebsocketsCloseCode.GOING_AWAY,
                        reason: "Closing Window or Tab."
                    })
                );
            },
            { signal: abortController.signal }
        );

        return () => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (!token || !tenant) {
                return;
            } else if (current.tenant === tenant) {
                return;
            } else if (socketsRef.current) {
                await socketsRef.current.close(WebsocketsCloseCode.NORMAL, "Changing tenant.");
            }
            const url = getUrl();

            if (!url) {
                console.error("Not possible to connect to the websocket without a valid URL.", {
                    tenant,
                    token
                });
                return;
            }

            socketsRef.current = createWebsocketsManager(
                createWebsocketsConnection({
                    subscriptionManager,
                    url,
                    tenant,
                    getToken,
                    protocol: ["webiny-ws-v1"]
                })
            );
            await socketsRef.current.connect();

            setCurrent({ tenant });
        })();
    }, [tenant, subscriptionManager, getToken]);

    const websocketActions = useMemo(() => {
        return createWebsocketsActions({
            manager: socketsRef.current!,
            tenant,
            getToken
        });
    }, [socketsRef.current, tenant, getToken]);

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

    const onError = useCallback(
        (cb: (data: IWebsocketsManagerErrorEvent) => void) => {
            return socketsRef.current!.onError(data => {
                return cb(data);
            });
        },
        [socketsRef.current]
    );

    const onClose = useCallback(
        (cb: (data: IWebsocketsManagerCloseEvent) => void) => {
            return socketsRef.current!.onClose(data => {
                return cb(data);
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
        onMessage,
        onError,
        onClose
    };
    return <WebsocketsContext.Provider value={value} {...props} />;
};
