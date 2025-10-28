import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di-container";
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
