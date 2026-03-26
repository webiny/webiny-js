import { UpgradeCommandHandler as UpgradeCommandHandlerAbstraction } from "./abstraction.js";

export class UpgradeCommandHandlerImpl implements UpgradeCommandHandlerAbstraction.Interface {
    public async handle(params: UpgradeCommandHandlerAbstraction.Params): Promise<void> {
        // do something!
        console.log({
            params
        });
    }
}

export const UpgradeCommandHandler = UpgradeCommandHandlerAbstraction.createImplementation({
    implementation: UpgradeCommandHandlerImpl,
    dependencies: []
});
