import { Plugin } from "@webiny/plugins/Plugin";
import { ModelBuilder } from "~/applications/headlessCms/builders/ModelBuilder";
import { CmsGroup } from "~/applications/headlessCms/graphql/types";

export interface Params {
    /**
     * Builder for model create and update input
     */
    modelBuilder: ModelBuilder;
    /**
     * Does this entry type have any other entry type dependencies?
     */
    dependencies?: string[];
}

export interface GetModelBuilderParams {
    group: CmsGroup;
}

export class CliCommandSeedHeadlessCmsEntryType extends Plugin {
    public static readonly type: string = "cli-plugin-seed-application-headless-cms-entry-type";
    private readonly params: Params;

    public constructor(params: Params) {
        super();
        const id = params.modelBuilder.modelId;
        if (id.match(/^([a-zA-Z]+)$/) === null) {
            throw new Error(`Plugin ID must be comprised of only [a-z] and [A-Z]. Input: "${id}"`);
        }
        this.params = params;
    }

    public getId(): string {
        return this.params.modelBuilder.modelId;
    }

    public getName(): string {
        return this.params.modelBuilder.name;
    }

    public getModelBuilder(params: GetModelBuilderParams): ModelBuilder {
        this.params.modelBuilder.setGroup(params.group);
        return this.params.modelBuilder;
    }

    public getModelId(): string {
        return this.params.modelBuilder.modelId;
    }

    public getDependencies(): string[] {
        return this.params.dependencies || [];
    }

    public validate(input: string[]): string | boolean {
        const dependency = this.validateDependencies(input);
        if (dependency !== true) {
            return dependency;
        }
        return true;
    }

    private validateDependencies(input: string[]): string | boolean {
        const dependencies = this.getDependencies();
        if (dependencies.length === 0) {
            return true;
        }
        for (const dep of dependencies) {
            if (input.includes(dep) === false) {
                return `Entry type plugin "${this.getName()}" is missing a dependency with ID "${dep}".`;
            }
        }
        return true;
    }
}
