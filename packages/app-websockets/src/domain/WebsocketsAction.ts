import {
    IGenericData,
    IWebsocketsAction,
    IWebsocketsActions,
    IWebsocketsActionsTriggerParams
} from "./types";

export class WebsocketsAction<
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
> implements IWebsocketsAction<T, R>
{
    private readonly actions: IWebsocketsActions;
    private readonly name: string;

    public constructor(actions: IWebsocketsActions, name: string) {
        this.name = name;
        this.actions = actions;
    }

    public async trigger(params?: IWebsocketsActionsTriggerParams<T, R>): Promise<R | null> {
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

export const createWebsocketsAction = <
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
>(
    actions: IWebsocketsActions,
    name: string
): IWebsocketsAction<T, R> => {
    return new WebsocketsAction<T, R>(actions, name);
};
