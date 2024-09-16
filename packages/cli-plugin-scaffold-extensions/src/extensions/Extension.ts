import { AbstractExtension, ExtensionTypeConstructorParams } from "./AbstractExtension";
import { AdminExtension } from "./AdminExtension";
import { ApiExtension } from "./ApiExtension";
import { WorkspaceExtension } from "./WorkspaceExtension";

export class Extension extends AbstractExtension {
    extension: AbstractExtension;

    constructor(params: ExtensionTypeConstructorParams) {
        super(params);

        switch (params.type) {
            case "admin": {
                this.extension = new AdminExtension(params);
                break;
            }
            case "api": {
                this.extension = new ApiExtension(params);
                break;
            }
            case "workspace": {
                this.extension = new WorkspaceExtension(params);
                break;
            }
            default: {
                throw new Error(`Unknown extension type: ${params.type}`);
            }
        }
    }

    async generate() {
        await this.extension.generate();
    }

    getNextSteps(): string[] {
        return this.extension.getNextSteps();
    }
}
