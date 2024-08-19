import { AbstractExtension, ExtensionTypeConstructorParams } from "./AbstractExtension";
import { AdminExtension } from "./AdminExtension";
import { ApiExtension } from "./ApiExtension";

export class Extension extends AbstractExtension {
    extensionType: AbstractExtension;

    constructor(params: ExtensionTypeConstructorParams) {
        super(params);

        switch (params.type) {
            case "admin": {
                this.extensionType = new AdminExtension(params);
                break;
            }
            case "api": {
                this.extensionType = new ApiExtension(params);
                break;
            }
            default: {
                throw new Error(`Unknown extension type: ${params.type}`);
            }
        }
    }

    async generate() {
        await this.extensionType.generate();
    }

    getNextSteps(): string[] {
        return this.extensionType.getNextSteps();
    }
}
