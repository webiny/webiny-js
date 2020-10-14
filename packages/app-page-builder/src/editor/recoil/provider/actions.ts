type EditorActionSubscribersType = Map<string, Set<Function>>;
const actions: EditorActionSubscribersType = new Map();
let actionCurrentlyRunning: string | undefined = undefined;

export enum ActionsEnum {
    NO_CALLABLES = 0,
    SUCCESS = 1,
    ABORTED = -1
}

const unsubscribeAll = () => {
    actions.clear();
};
const subscribe = (action: string, callable: Function) => {
    if (!actions.has(action)) {
        actions.set(action, new Set());
    }
    if (actions.get(action).has(callable)) {
        throw new Error(`You cannot subscribe to one action with same function.`);
    }
    actions.get(action).add(callable);
};
const unsubscribe = (action: string, callable: Function) => {
    if (!actions.has(action)) {
        throw new Error(
            `It seems you want to unsubscribe to an action that you have not subscribed to with given function.`
        );
    }
    const newSet = new Set<Function>();
    for (const fn of actions.get(action)) {
        if (fn != callable) {
            newSet.add(fn);
        }
    }
    actions.set(action, newSet);
};
const runAction = async (action: string, args?: any) => {
    if (actionCurrentlyRunning) {
        throw new Error(`Currently there is an action running "${actionCurrentlyRunning}".`);
    }
    const targetCallables = actions.get(action);
    if (!targetCallables) {
        return ActionsEnum.NO_CALLABLES;
    }
    actionCurrentlyRunning = action;
    for (const fn of targetCallables.values()) {
        try {
            const result = fn(...(args || {}));
            if (result === false) {
                actionCurrentlyRunning = undefined;
                return ActionsEnum.ABORTED;
            }
        } catch (ex) {
            actionCurrentlyRunning = undefined;
            throw new Error(`Action "${action}" produced some kind of exception, please check it.`);
        }
    }
    actionCurrentlyRunning = undefined;
    return ActionsEnum.SUCCESS;
};
export { unsubscribeAll, runAction, subscribe, unsubscribe };
