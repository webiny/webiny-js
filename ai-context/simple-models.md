```ts
// Page/PageModelBuilder.ts
import { ModelBuilder as Builder } from "~/models/ModelBuilder.js";
import { createImplementation } from "@webiny/di";
import { PageSchema, PageModelBuilder as BuilderAbstraction, type IPage } from "./abstractions";

class PageModelBuilderImpl implements BuilderAbstraction.Interface {
    async buildModel() {
        return new Builder<IPage>("Page", PageSchema).withMethods({
            hasTitle() {
                return this.title !== "";
            },
            cancel() {}
        });
    }
}

export const PageModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: PageModelBuilderImpl,
    dependencies: []
});
```

```ts
// Page/PageModelFactory.ts
import { createImplementation } from "@webiny/di";
import {
    PageModelFactory as FactoryAbstraction,
    PageModelBuilder,
    type IPage
} from "./abstractions";
import type { ModelClass } from "~/models/ModelBuilder.js";

class PageModelFactoryImpl implements FactoryAbstraction.Interface {
    private modelClass: ModelClass<IPage> | undefined;

    constructor(private modelBuilder: PageModelBuilder.Interface) {}

    async create(data: FactoryAbstraction.CreateInput): Promise<IPage> {
        if (this.modelClass) {
            return this.modelClass.create(data);
        }

        const builder = await this.modelBuilder.buildModel();
        this.modelClass = builder.build();

        return this.modelClass.create(data);
    }
}

export const PageModelFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: PageModelFactoryImpl,
    dependencies: [PageModelBuilder]
});
```

```ts
// Page/__tests__/PageModelBuilderDecorator.ts
import { createDecorator } from "@webiny/di";
import { PageModelBuilder as BuilderAbstraction } from "../abstractions";

class PageModelBuilderDecoratorImpl implements BuilderAbstraction.Interface {
    constructor(private decoratee: BuilderAbstraction.Interface) {}

    async buildModel() {
        const builder = await this.decoratee.buildModel();

        return builder
            .extendSchema(z => ({
                seo: z.object({
                    title: z.string()
                })
            }))
            .withMethods({
                hasSeoTitle() {
                    return this.extensions?.seo?.title !== "";
                }
            });
    }
}

export const PageModelBuilderDecorator = createDecorator({
    abstraction: BuilderAbstraction,
    decorator: PageModelBuilderDecoratorImpl,
    dependencies: []
});

declare module "~/simple/Page/abstractions.js" {
    interface IPage {
        hasSeoTitle(): boolean;
    }

    interface IPageExtensions {
        seo?: { title: string };
    }
}
```

```ts
// Page/__tests__/PageModelBuilderDecorator2.ts
import { createDecorator } from "@webiny/di";
import { PageModelBuilder as BuilderAbstraction } from "../abstractions";

class PageModelBuilderDecorator2Impl implements BuilderAbstraction.Interface {
    constructor(private decoratee: BuilderAbstraction.Interface) {}

    async buildModel() {
        const builder = await this.decoratee.buildModel();

        return builder.extendSchema(z => ({
            social: z.object({
                description: z.string()
            })
        }));
    }
}

export const PageModelBuilderDecorator2 = createDecorator({
    abstraction: BuilderAbstraction,
    decorator: PageModelBuilderDecorator2Impl,
    dependencies: []
});

declare module "~/simple/Page/abstractions.js" {
    interface IPageExtensions {
        social?: { description: string };
    }
}
```

```ts
// Page/__tests__/PageModelFactory.test.ts
import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { PageModelBuilder } from "~/simple/Page/PageModelBuilder.js";
import { PageModelFactory } from "~/simple/Page/PageModelFactory.js";
import { PageModelFactory as FactoryAbstraction } from "~/simple/Page/abstractions.js";
import { PageModelBuilderDecorator } from "./PageModelBuilderDecorator.js";
import { PageModelBuilderDecorator2 } from "./PageModelBuilderDecorator2.js";

describe("PageModelFactory", () => {
    it("should be able to create page instance", async () => {
        const container = new Container();
        container.register(PageModelBuilder);
        container.register(PageModelFactory);
        container.registerDecorator(PageModelBuilderDecorator);
        container.registerDecorator(PageModelBuilderDecorator2);

        const pageModelFactory = container.resolve(FactoryAbstraction);

        const page1 = await pageModelFactory.create({
            id: "1",
            title: "Test",
            content: "test",
            publishedAt: new Date(),
            extensions: {
                seo: {
                    title: "SEO"
                },
                social: {
                    description: "Networking"
                }
            }
        });

        expect(page1.title).toEqual("Test");
        expect(page1.extensions?.seo?.title).toEqual("SEO");
        expect(page1.extensions?.social?.description).toEqual("Networking");
        expect(page1.hasTitle()).toEqual(true);
        expect(page1.hasSeoTitle()).toEqual(true);
    });
});
```

```ts
// Page/abstractions.ts
import { createAbstraction } from "@webiny/features/api";
import { createModelSchema } from "~/models/ModelBuilder.js";
import type { IModel, IModelBuilder, IModelFactory, IModelInput } from "~/models/abstractions.js";

export const PageSchema = createModelSchema(z => ({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    publishedAt: z.date().nullable()
}));

export interface IPageExtensions {}

export interface IPage extends IModel<typeof PageSchema> {
    hasTitle(): boolean;
    cancel(): void;
    bokPavel(): void;
    extensions?: IPageExtensions;
}

export const PageModelFactory = createAbstraction<IModelFactory<IPage>>("PageModelFactory");

export namespace PageModelFactory {
    export type Interface = IModelFactory<IPage>;
    export type CreateInput = IModelInput<IPage>;
}

export const PageModelBuilder = createAbstraction<IModelBuilder<IPage>>("PageModelBuilder");

export namespace PageModelBuilder {
    export type Interface = IModelBuilder<IPage>;
}
```
