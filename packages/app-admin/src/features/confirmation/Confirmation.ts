import { Confirmation as Abstraction, NamedDialogOpener } from "./abstractions.js";

class ConfirmationImpl implements Abstraction.Interface {
    constructor(private dialogOpener: NamedDialogOpener.Interface) {}

    async confirm<TData = void, TParams extends Record<string, unknown> = Record<string, unknown>>(
        name: string,
        params?: TParams
    ): Promise<TData | false>;
    async confirm<
        TData = void,
        TParams extends Record<string, unknown> = Record<string, unknown>,
        TResult = unknown
    >(
        name: string,
        params: TParams,
        execute: (data: TData) => Promise<TResult>
    ): Promise<TResult | false>;
    async confirm(
        name: string,
        params?: Record<string, unknown>,
        execute?: (data: unknown) => Promise<unknown>
    ): Promise<unknown> {
        return new Promise(resolve => {
            this.dialogOpener.open(name, {
                ...params,
                onConfirm: async (data: unknown) => {
                    if (execute) {
                        const result = await execute(data);
                        resolve(result);
                    } else {
                        resolve(data);
                    }
                },
                onCancel: () => resolve(false)
            });
        });
    }
}

export const Confirmation = Abstraction.createImplementation({
    implementation: ConfirmationImpl,
    dependencies: [NamedDialogOpener]
});
