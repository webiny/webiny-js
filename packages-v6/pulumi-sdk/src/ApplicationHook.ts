// TODO add typing to deploy hooks
export interface ApplicationHook {
    (params: any, context: any): Promise<void> | void;
}

export function defineAppHook(appHook: ApplicationHook) {
    return appHook;
}
