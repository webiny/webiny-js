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

        // Call paramsSchema with context that includes z
        const contextWithZ = { ...this.context, z };
        const result = this.definition.paramsSchema(contextWithZ);
        
        // Check if the result is already a Zod object or a plain object
        let paramsSchema: z.ZodObject<any>;
        if (result && typeof result === 'object' && 'safeParse' in result) {
            // Result is already a ZodObject (e.g., z.object({...}))
            paramsSchema = result as z.ZodObject<any>;
        } else {
            // Result is a plain object, wrap it
            paramsSchema = z.object(result as any);
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
