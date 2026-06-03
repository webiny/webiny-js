import { Confirmation as Abstraction, NamedDialogOpener } from "./abstractions.js";

class ConfirmationImpl implements Abstraction.Interface {
    constructor(private dialogOpener: NamedDialogOpener.Interface) {}

    async confirm<TData = void, TParams extends Record<string, unknown> = Record<string, unknown>>(
        name: string,
        params?: TParams,
        execute?: (data: TData) => Promise<unknown>
    ): Promise<TData | false> {
        return new Promise<TData | false>(resolve => {
            this.dialogOpener.open(name, {
                ...params,
                onConfirm: async (data: TData) => {
                    if (execute) {
                        await execute(data);
                    }
                    resolve(data);
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
