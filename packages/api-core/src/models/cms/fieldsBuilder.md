Let's implement a multi-instance DI pattern where all field types implement the same abstraction.

Core Architecture
cms/fields/abstractions.ts

```ts
import { Abstraction } from "@webiny/di-container";
import type { FieldBuilder } from "../FieldBuilder.js";

/**
 * Field Type Factory - creates a field builder instance
 */
export interface IFieldTypeFactory {
  /** Unique identifier for this field type */
  readonly type: string;

  /** Create a new field builder instance */
  create(): FieldBuilder<any>;
}

/**
 * Field Type abstraction - use with { multiple: true } in DI
 */
export const FieldType = new Abstraction<IFieldTypeFactory>("FieldType");
```

cms/fields/TextFieldType.ts

```ts
import { createImplementation } from "@webiny/di-container";
import { z } from "zod";
import { FieldBuilder } from "../FieldBuilder.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";

export interface ITextFieldBuilder extends FieldBuilder<z.ZodString> {
  label(text: string): this;
  required(message?: string): this;
  minLength(length: number, message?: string): this;
  maxLength(length: number, message?: string): this;
  slug(): this;
  email(): this;
  url(): this;
  unique(): this;
  help(text: string): this;
  placeholder(text: string): this;
}

class TextFieldBuilder extends FieldBuilder<z.ZodString> implements ITextFieldBuilder {
  constructor() {
    super("text", z.string());
  }

  required(message?: string): this {
    this.zodSchema = this.zodSchema.min(1, message || "Field is required");
    this.config.validation?.push({
      name: "required",
      message: message || "Field is required",
      settings: {}
    });
    return this;
  }

  minLength(length: number, message?: string): this {
    this.zodSchema = this.zodSchema.min(length, message);
    return this;
  }

  maxLength(length: number, message?: string): this {
    this.zodSchema = this.zodSchema.max(length, message);
    return this;
  }

  slug(): this {
    this.zodSchema = this.zodSchema.regex(/^[a-z0-9-]+$/, "Must be a valid slug");
    this.config.validation?.push({
      name: "slug",
      message: "Must be a valid slug",
      settings: {}
    });
    return this;
  }

  email(): this {
    this.zodSchema = this.zodSchema.email("Must be a valid email");
    this.config.validation?.push({
      name: "email",
      message: "Must be a valid email",
      settings: {}
    });
    return this;
  }

  url(): this {
    this.zodSchema = this.zodSchema.url("Must be a valid URL");
    this.config.validation?.push({
      name: "url",
      message: "Must be a valid URL",
      settings: {}
    });
    return this;
  }

  unique(): this {
    this.config.validation?.push({
      name: "unique",
      message: "Value must be unique",
      settings: {}
    });
    return this;
  }
}

class TextFieldTypeFactory implements IFieldTypeFactory {
  readonly type = "text";

  create(): ITextFieldBuilder {
    return new TextFieldBuilder();
  }
}

export const TextFieldType = createImplementation({
  abstraction: FieldType,
  implementation: TextFieldTypeFactory,
  dependencies: []
});
```

cms/FieldBuilderRegistry.ts - Multi-instance injection

```ts
import { createImplementation, Container } from "@webiny/di-container";
import { z } from "zod";
import {
  FieldBuilderRegistry as RegistryAbstraction,
  type IFieldBuilderRegistry
} from "./abstractions.js";
import { FieldType, type IFieldTypeFactory } from "./fields/abstractions.js";
import type { FieldBuilder } from "./FieldBuilder.js";

class FieldBuilderRegistryImpl implements IFieldBuilderRegistry {
  private fieldTypes = new Map<string, IFieldTypeFactory>();

  constructor(
    fieldTypeFactories: IFieldTypeFactory[] // ✅ Inject ALL field types!
  ) {
    // Register all field types by their type name
    for (const factory of fieldTypeFactories) {
      this.fieldTypes.set(factory.type, factory);
    }

    // Return Proxy for dynamic method access
    return new Proxy(this, {
      get(target, prop: string) {
        // Check if it's a registered field type
        const factory = target.fieldTypes.get(prop);
        if (factory) {
          return () => factory.create();
        }

        // Otherwise return the actual property
        return (target as any)[prop];
      }
    }) as any;
  }

  // TypeScript interface needs these (but Proxy provides them at runtime)
  text = undefined as any;
  object = undefined as any;
}

export const FieldBuilderRegistryImplementation = createImplementation({
  abstraction: RegistryAbstraction,
  implementation: FieldBuilderRegistryImpl,
  dependencies: [[FieldType, { multiple: true }]] // ✅ Multi-instance!
});
```

cms/abstractions.ts - Base interface

```ts
import { Abstraction } from "@webiny/di-container";
import type { BaseModel } from "~/models/BaseModel.js";
import type { IModelData } from "~/models/abstractions.js";
import type { IPrivateCmsModelConfiguration } from "./PrivateCmsModelBuilder.js";
import type { FieldDefinitionsFactory } from "./FieldDefinitionsBuilder.js";
import type { ITextFieldBuilder } from "./fields/TextFieldType.js";
import { z } from "zod";
import type { FieldBuilder } from "./FieldBuilder.js";

/**
 * Field Builder Registry
 * Plugins can extend this via module augmentation
 */
export interface IFieldBuilderRegistry {
  text(): ITextFieldBuilder;
  // object is special - needs registry reference
  object<TShape extends z.ZodRawShape>(
    fields: (registry: IFieldBuilderRegistry) => { [K in keyof TShape]: FieldBuilder<TShape[K]> }
  ): FieldBuilder<z.ZodObject<TShape>>;
}

export const FieldBuilderRegistry = new Abstraction<IFieldBuilderRegistry>("FieldBuilderRegistry");

// ... rest of abstractions
```

Plugin: Color Field
plugins/color-field/ColorFieldType.ts

```ts
import { createImplementation } from "@webiny/di-container";
import { z } from "zod";
import { FieldBuilder } from "~/cms/FieldBuilder.js";
import { FieldType, type IFieldTypeFactory } from "~/cms/fields/abstractions.js";

export interface IColorFieldBuilder extends FieldBuilder<z.ZodString> {
  label(text: string): this;
  required(message?: string): this;
  default(hex: string): this;
  allowAlpha(): this;
  palette(colors: string[]): this;
  help(text: string): this;
}

class ColorFieldBuilder extends FieldBuilder<z.ZodString> implements IColorFieldBuilder {
  constructor() {
    super("color", z.string().regex(/^#[0-9A-Fa-f]{6}$/));
  }

  required(message?: string): this {
    this.zodSchema = this.zodSchema.min(1, message || "Color is required");
    this.config.validation?.push({
      name: "required",
      message: message || "Color is required",
      settings: {}
    });
    return this;
  }

  default(hex: string): this {
    this.zodSchema = this.zodSchema.default(hex);
    this.config.settings = { ...this.config.settings, default: hex };
    return this;
  }

  allowAlpha(): this {
    this.zodSchema = z.string().regex(/^#[0-9A-Fa-f]{6,8}$/);
    this.config.settings = { ...this.config.settings, allowAlpha: true };
    return this;
  }

  palette(colors: string[]): this {
    this.config.settings = { ...this.config.settings, palette: colors };
    return this;
  }
}

class ColorFieldTypeFactory implements IFieldTypeFactory {
  readonly type = "color";

  create(): IColorFieldBuilder {
    return new ColorFieldBuilder();
  }
}

// ✅ Register as FieldType implementation!
export const ColorFieldType = createImplementation({
  abstraction: FieldType,
  implementation: ColorFieldTypeFactory,
  dependencies: []
});
```

plugins/color-field/module-augmentation.ts

```ts
// Module augmentation for TypeScript autocomplete
declare module "~/cms/abstractions.js" {
  interface IFieldBuilderRegistry {
    color(): IColorFieldBuilder;
  }
}

import type { IColorFieldBuilder } from "./ColorFieldType.js";
```

plugins/color-field/index.ts

```ts
import type { Container } from "@webiny/di-container";
import { ColorFieldType } from "./ColorFieldType.js";
import "./module-augmentation.js"; // ✅ Import for side effects

export function registerColorField(container: Container) {
// ✅ Just register the implementation - that's it!
container.register(ColorFieldType);
}

export { ColorFieldType, type IColorFieldBuilder } from "./ColorFieldType.js";
Registration
typescriptimport { Container } from "@webiny/di-container";
import { FieldBuilderRegistryImplementation } from "~/cms/FieldBuilderRegistry.js";
import { TextFieldType } from "~/cms/fields/TextFieldType.js";
import { registerColorField } from "~/plugins/color-field/index.js";

const container = new Container();

// ✅ Register core field types
container.register(TextFieldType);
// container.register(NumberFieldType);
// container.register(DateFieldType);
// ... etc

// ✅ Register registry (will automatically get all FieldType implementations)
container.register(FieldBuilderRegistryImplementation);

// ✅ Register plugin field types
registerColorField(container);
```

// That's it! No decorators needed!
Usage

```ts
const PageFieldDefinitions = createFieldDefinitions(fields => ({
  id: fields.text().required(),
  title: fields.text().label("Title").required(),
  backgroundColor: fields
    .color() // ✅ Autocomplete works!
    .label("Background Color")
    .default("#ffffff")
    .palette(["#ff0000", "#00ff00", "#0000ff"])
}));
```

Tests

```ts
describe("Color Field Plugin", () => {
  it("should register and use color field via multi-instance DI", async () => {
    const container = new Container();

    // Register core fields
    container.register(TextFieldType);

    // Register color field plugin
    registerColorField(container);

    // Register infrastructure
    container.register(FieldBuilderRegistryImplementation);
    container.register(PrivateCmsModelBuilderImplementation);

    const fieldDefs = createFieldDefinitions(fields => ({
      id: fields.text().required(),
      bgColor: fields.color().label("Background").default("#ffffff")
    }));

    type Schema = InferFieldSchema<typeof fieldDefs>;
    interface ITestModel extends IModel<Schema> {}

    const builder = container.resolve(PrivateCmsModelBuilder);
    const model = builder.create<ITestModel>("test", fieldDefs).__build();

    const instance = model.create({
      id: "1",
      bgColor: "#ff5733"
    });

    expect(instance.bgColor).toBe("#ff5733");
  });
});
```

Benefits
✅ One abstraction - FieldType for all field types
✅ Zero boilerplate - No decorators, just register implementations
✅ Multi-instance DI - Container automatically collects all implementations
✅ Module augmentation - TypeScript autocomplete works
✅ Simple plugin registration - Just container.register(ColorFieldType)
✅ Uniform pattern - All field types follow same structure
✅ Easy to add fields - Create factory, register, done!
To add a new field type:

Create XFieldTypeFactory implements IFieldTypeFactory
Register as FieldType implementation
Add module augmentation for TypeScript
