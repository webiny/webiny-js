import { Plugin } from "@webiny/plugins/Plugin";

export interface Params {
    id: string;
    name: string;
    dependencies?: string[];
}
export class CliCommandSeedHeadlessCmsEntryType extends Plugin {
    public static readonly type: string = "cli-plugin-seed-application-headless-cms-entry-type";

    private readonly params: Params;

    public constructor(params: Params) {
        super();
        if (params.id.match(/^([a-zA-Z]+)$/) === null) {
            throw new Error(
                `Plugin ID must be comprised of only [a-z] and [A-Z]. Input: "${params.id}"`
            );
        }
        this.params = params;
    }

    public getId(): string {
        return this.params.id;
    }

    public getName(): string {
        return this.params.name;
    }

    public validate(input: string[]): string | boolean {
        const dependency = this.validateDependencies(input);
        if (dependency !== true) {
            return dependency;
        }
        return true;
    }

    private validateDependencies(input: string[]): string | boolean {
        if (!this.params.dependencies || this.params.dependencies.length === 0) {
            return true;
        }
        for (const dep of this.params.dependencies) {
            if (input.includes(dep) === false) {
                return `Entry type plugin "${this.params.name}" is missing a dependency with ID "${dep}".`;
            }
        }
        return true;
    }
}
