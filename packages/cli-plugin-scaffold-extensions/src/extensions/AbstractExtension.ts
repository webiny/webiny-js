export interface ExtensionTypeConstructorParams {
    name: string;
    type: string;
    location: string;
    packageName: string;
}

export abstract class AbstractExtension {
    protected params: ExtensionTypeConstructorParams;

    constructor(params: ExtensionTypeConstructorParams) {
        this.params = params;
    }

    abstract generate(): Promise<void>;

    abstract getNextSteps(): string[];
}
