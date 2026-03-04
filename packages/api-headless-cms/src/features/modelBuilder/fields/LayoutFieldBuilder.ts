import { BaseFieldBuilder } from "./BaseFieldBuilder.js";

/**
 * Slim base class for layout fields (separators, alerts, tabs, etc.).
 * Layout fields only support label, description, help, and note — no list(), storageId(), etc.
 */
export abstract class LayoutFieldBuilder<
    TType extends string = string
> extends BaseFieldBuilder<TType> {}
