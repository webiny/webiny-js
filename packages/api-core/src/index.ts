/**
 * Model Builder
 */
export type { IModel, IModelBuilder, IModelFactory } from "./models/abstractions.js";
export { createModelSchema, ModelBuilder, type ModelClass } from "./models/ModelBuilder.js";

/**
 * DI Container
 */
export {
    Container,
    Abstraction,
    createDecorator,
    createImplementation,
    createComposite
} from "@webiny/di-container";
