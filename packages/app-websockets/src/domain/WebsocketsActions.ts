import {
    IGenericData,
    IWebsocketsActions,
    IWebsocketsActionsRunParams,
    IWebsocketsManager,
    IWebsocketManagerSendData
} from "./types";

export interface IWebsocketActionsParams {
    manager: IWebsocketsManager;
    tenant: string | null;
    locale: string | null;
    getToken: () => Promise<string | undefined>;
}

export class WebsocketsActions implements IWebsocketsActions {
    public readonly manager: IWebsocketsManager;

    private readonly getToken: () => Promise<string | undefined>;
    private readonly tenant: string | null;
    private readonly locale: string | null;

    public constructor(params: IWebsocketActionsParams) {
        this.manager = params.manager;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.getToken = params.getToken;
    }

    public async run<T extends IGenericData = IGenericData, R extends IGenericData = IGenericData>(
        params: IWebsocketsActionsRunParams<T>
    ): Promise<R | null> {
        const { action, timeout, data } = params;
        const token = await this.getToken();
        if (!token) {
            console.error("Token is not set - cannot send a websocket message.");
            return null;
        } else if (!this.tenant) {
            console.error("Tenant is not set - cannot send a websocket message.");
            return null;
        } else if (!this.locale) {
            console.error("Locale is not set - cannot send a websocket message.");
            return null;
        }
        /**
         * If no timeout was sent, we will just send the message and return null.
         * No waiting for the response.
         */
        if (!timeout || timeout < 0) {
            this.manager.send<IWebsocketManagerSendData<T>>({
                /**
                 * It is ok to cast as we are checking the values a few lines above.
                 */
                token,
                tenant: this.tenant as string,
                locale: this.locale as string,
                action,
                data: data || ({} as T)
            });
            return null;
        }
        /**
         * In case of a timeout, we will send the message and wait for the response.
         */
        return await new Promise<R>((resolve, reject) => {
            let promiseTimeout: NodeJS.Timeout | null = null;
            const subscription = this.manager.onMessage<R>(async event => {
                if (event.data.messageId !== subscription.id) {
                    return;
                }
                resolve(event.data);
                subscription.off();
                if (!promiseTimeout) {
                    return;
                }
                clearTimeout(promiseTimeout);
            });

            promiseTimeout = setTimeout(() => {
                const message = `Websocket action "${action}" timeout.`;
                subscription.off();
                reject(new Error(message));
            }, timeout);

            this.manager.send<IWebsocketManagerSendData<T>>({
                /**
                 * It is ok to cast as we are checking the values a few lines above.
                 */
                token,
                tenant: this.tenant as string,
                locale: this.locale as string,
                messageId: subscription.id,
                action,
                data: data || ({} as T)
            });
        }).catch(ex => {
            console.error("Error while sending websocket message.", ex);
            return null;
        });
    }
}

export const createWebsocketsActions = (params: IWebsocketActionsParams): IWebsocketsActions => {
    return new WebsocketsActions(params);
};
