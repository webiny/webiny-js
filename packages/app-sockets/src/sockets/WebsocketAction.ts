import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import { IWebsocketActions } from "~/sockets/abstractions/IWebsocketActions";
import { IWebsocketAction, IWebsocketActionsTriggerParams } from "./abstractions/IWebsocketAction";

export class WebsocketAction<
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
> implements IWebsocketAction<T, R>
{
    private readonly actions: IWebsocketActions;
    private readonly name: string;

    public constructor(actions: IWebsocketActions, name: string) {
        this.name = name;
        this.actions = actions;
    }

    public async trigger(params?: IWebsocketActionsTriggerParams<T, R>): Promise<R | null> {
        const { data, onResponse, timeout = 10000 } = params || {};
        const promise = this.actions.run<T, R>({
            action: this.name,
            data,
            timeout: onResponse && timeout > 0 ? timeout : undefined
        });
        if (!onResponse) {
            return null;
        }
        const result = await promise;

        return onResponse(result);
    }
}

export const createWebsocketAction = <
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
>(
    actions: IWebsocketActions,
    name: string
): IWebsocketAction<T, R> => {
    return new WebsocketAction<T, R>(actions, name);
};
