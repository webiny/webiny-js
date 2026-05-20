import { WcpService } from "@webiny/app-admin/features/wcp/abstractions.js";
import { FileFieldsProvider as Abstraction } from "./abstractions.js";

class FileFieldsProviderWithWcpImpl implements Abstraction.Interface {
    constructor(
        private wcp: WcpService.Interface,
        private decoratee: Abstraction.Interface
    ) {}

    async execute(): Promise<string[]> {
        const fields = await this.decoratee.execute();

        if (this.wcp.getProject().canUsePrivateFiles()) {
            return [...fields, "accessControl.type"];
        }

        return fields;
    }
}

export const FileFieldsProviderWithWcp = Abstraction.createDecorator({
    decorator: FileFieldsProviderWithWcpImpl,
    dependencies: [WcpService]
});
