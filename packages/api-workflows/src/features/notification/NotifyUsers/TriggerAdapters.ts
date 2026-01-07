import { Result } from "@webiny/feature/api";
import { NotificationAdapter } from "~/domain/notification/abstractions.js";
import {
    type ITriggerAdaptersParams,
    TriggerAdapters as TriggerAdaptersAbstraction,
    type TriggerAdaptersResult
} from "./abstractions.js";

class TriggerAdaptersImpl implements TriggerAdaptersAbstraction.Interface {
    public constructor(private adapters: NotificationAdapter.Interface[]) {}

    public hasAny(): boolean {
        return this.adapters.length > 0;
    }

    public async execute(params: ITriggerAdaptersParams): Promise<TriggerAdaptersResult> {
        const { users, message } = params;
        // execute all adapters in parallel?
        const promises = await Promise.all(
            this.adapters.map(async adapter => {
                try {
                    return await adapter.send({
                        message,
                        users
                    });
                } catch (ex) {
                    return;
                }
            })
        );

        return Result.ok();
    }
}

export const TriggerAdapters = TriggerAdaptersAbstraction.createImplementation({
    implementation: TriggerAdaptersImpl,
    dependencies: [[NotificationAdapter, { multiple: true }]]
});
