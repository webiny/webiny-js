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

        // Try the new pattern first: (z) => ({...})
        // This returns a plain object, which we need to wrap with z.object()
        try {
            const result = this.definition.paramsSchema(z as any);
            
            // Check if the result is already a Zod object (legacy pattern)
            // or a plain object (new pattern)
            if (result && typeof result === 'object' && 'safeParse' in result) {
                // Legacy pattern: result is already a ZodObject with validation methods
                paramsSchema = result as z.ZodObject<any>;
            } else {
                // New pattern: result is a plain object, wrap it
                paramsSchema = z.object(result as any);
            }
        } catch (error) {
            // If calling with z fails, try the legacy pattern with context
            paramsSchema = this.definition.paramsSchema(this.context as any) as z.ZodObject<any>;
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
