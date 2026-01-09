import { type ExtensionDefinitionModel } from "./ExtensionDefinitionModel.js";
import { z } from "zod";
import { type ProjectModel } from "~/models/index.js";
import { ProjectError } from "~/ProjectError.js";
import { type ParamsSchemaDefinition, type ParamsSchemaInfer } from "~/defineExtension/types.js";

export interface ExtensionInstanceModelContext {
    [key: string]: any;

    project: ProjectModel;
}

export class ExtensionInstanceModel<TParamsSchema extends ParamsSchemaDefinition | undefined> {
    constructor(
        public definition: ExtensionDefinitionModel<TParamsSchema>,
        public params: TParamsSchema extends ParamsSchemaDefinition ? ParamsSchemaInfer<TParamsSchema> : any,
        public context: ExtensionInstanceModelContext
    ) {}

    async build() {
        return this.definition.build?.(this.params, this.context);
    }

    async validate() {
        return this.definition.validate?.(this.params);
    }

    async validateParams() {
        if (!this.definition.paramsSchema) {
            return;
        }

        let paramsSchema: z.ZodObject<any>;

        // Try to detect which pattern we're using
        // If it takes 'project' as a parameter, it's the old pattern
        const funcStr = this.definition.paramsSchema.toString();
        if (funcStr.includes('project') || funcStr.includes('ctx')) {
            // Old pattern: ({ project }) => z.object({...})
            paramsSchema = (this.definition.paramsSchema as any)(this.context);
        } else {
            // New pattern: z => ({...})
            const paramsSchemaDefinition = (this.definition.paramsSchema as any)(z);
            paramsSchema = z.object(paramsSchemaDefinition);
        }

        const validationResult = await paramsSchema.safeParseAsync(this.params);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(err => err.message).join("; ");

            throw ProjectError.from(
                `Validation failed for extension of type %s: ${errorMessages}`,
                this.definition.type
            );
        }
    }
}
