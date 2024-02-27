import {
    IWebsocketManager,
    IWebsocketManagerSendData
} from "~/sockets/abstractions/IWebsocketManager";
import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import { IWebsocketActions } from "./abstractions/IWebsocketActions";

export interface IWebsocketActionsParams {
    manager: IWebsocketManager;
    tenant: string | null;
    locale: string | null;
    getToken: () => Promise<string | null>;
}

export class WebsocketActions implements IWebsocketActions {
    public readonly manager: IWebsocketManager;

    private readonly getToken: () => Promise<string | null>;
    private readonly tenant: string | null;
    private readonly locale: string | null;

    public constructor(params: IWebsocketActionsParams) {
        this.manager = params.manager;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.getToken = params.getToken;
    }

    public async action<
        T extends IGenericData = IGenericData,
        R extends IGenericData = IGenericData
    >(action: string, data?: T, timeout = 10000): Promise<R | null> {
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

        return new Promise<R>((resolve, reject) => {
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
                console.error(message);
                console.info(JSON.stringify(data, null, 2));
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
