import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di-container";
import { FieldBuilderRegistry } from "~/cms/FieldBuilderRegistry.js";
import { PrivateCmsModelBuilder } from "~/cms/PrivateCmsModelBuilder.js";
import { PageCmsModelBuilder } from "../PageModelBuilder.js";
import { PageModelFactory } from "../PageModelFactory.js";
import { PageModelFactory as FactoryAbstraction } from "../abstractions.js";
import { PageSeoDecorator } from "./PageSeoDecorator.js";
import { PagePublishingDecorator } from "./PagePublishingDecorator.js";

describe("PageModelFactory", () => {
    it("should create page instances", async () => {
        const container = new Container();

        // Register core infrastructure
        container.register(FieldBuilderRegistry);
        container.register(PrivateCmsModelBuilder);

        // Register Page model
        container.register(PageCmsModelBuilder);
        container.register(PageModelFactory);

        const factory = container.resolve(FactoryAbstraction);

        const page = await factory.create({
            id: "1",
            title: "Home Page",
            path: "home",
            content: "Welcome to our site"
        });

        expect(page.id).toBe("1");
        expect(page.title).toBe("Home Page");
        expect(page.path).toBe("home");
        expect(page.getFullPath()).toBe("/home");
    });

    it("should work with path that already has slash", async () => {
        const container = new Container();
        container.register(FieldBuilderRegistry);
        container.register(PrivateCmsModelBuilder);
        container.register(PageCmsModelBuilder);
        container.register(PageModelFactory);

        const factory = container.resolve(FactoryAbstraction);

        const page = await factory.create({
            id: "1",
            title: "About",
            path: "/about",
            content: "About us"
        });

        expect(page.getFullPath()).toBe("/about");
    });

    it("should cache model class and reuse it", async () => {
        const container = new Container();
        container.register(FieldBuilderRegistry);
        container.register(PrivateCmsModelBuilder);
        container.register(PageCmsModelBuilder);
        container.register(PageModelFactory);

        const factory = container.resolve(FactoryAbstraction);

        const page1 = await factory.create({
            id: "1",
            title: "Page 1",
            path: "page-1",
            content: "Content 1"
        });

        const page2 = await factory.create({
            id: "2",
            title: "Page 2",
            path: "page-2",
            content: "Content 2"
        });

        // Both should be instances of the same class
        expect(page1.constructor).toBe(page2.constructor);
    });

    describe("With SEO Decorator", () => {
        it("should add SEO fields and methods", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            // Register SEO decorator
            container.registerDecorator(PageSeoDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content",
                extensions: {
                    seo: {
                        title: "Home - SEO Title",
                        description: "SEO Description",
                        keywords: "home, website"
                    }
                }
            });

            expect(page.getSeoTitle()).toBe("Home - SEO Title");
            expect(page.hasSeo()).toBe(true);
        });

        it("should fall back to title when no SEO title", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            container.registerDecorator(PageSeoDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content"
            });

            expect(page.getSeoTitle()).toBe("Home");
            expect(page.hasSeo()).toBe(false);
        });
    });

    describe("With Publishing Decorator", () => {
        it("should add publishing fields and methods", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            container.registerDecorator(PagePublishingDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content"
            });

            expect(page.isDraft()).toBe(true);
            expect(page.isPublished()).toBe(false);

            page.publish("user-123");

            expect(page.isDraft()).toBe(false);
            expect(page.isPublished()).toBe(true);
            expect(page.extensions?.publishedBy).toBe("user-123");
            expect(page.extensions?.publishedAt).toBeDefined();
        });

        it("should unpublish page", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            container.registerDecorator(PagePublishingDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content",
                extensions: {
                    status: "published",
                    publishedAt: "2024-01-01",
                    publishedBy: "user-123"
                }
            });

            expect(page.isPublished()).toBe(true);

            page.unpublish();

            expect(page.isDraft()).toBe(true);
            expect(page.isPublished()).toBe(false);
        });
    });

    describe("With Multiple Decorators", () => {
        it("should combine SEO and Publishing decorators", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            // Register both decorators
            container.registerDecorator(PageSeoDecorator);
            container.registerDecorator(PagePublishingDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content",
                extensions: {
                    seo: {
                        title: "Home SEO",
                        description: "Description",
                        keywords: "keywords"
                    }
                }
            });

            // Base methods work
            expect(page.getFullPath()).toBe("/home");

            // SEO methods work
            expect(page.getSeoTitle()).toBe("Home SEO");
            expect(page.hasSeo()).toBe(true);

            // Publishing methods work
            expect(page.isDraft()).toBe(true);
            page.publish("user-456");
            expect(page.isPublished()).toBe(true);
            expect(page.extensions?.publishedBy).toBe("user-456");
        });
    });

    describe("Model Operations", () => {
        it("should support clone()", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            const factory = container.resolve(FactoryAbstraction);

            const original = await factory.create({
                id: "1",
                title: "Original",
                path: "original",
                content: "Content"
            });

            const cloned = original.clone();

            expect(cloned).not.toBe(original);
            expect(cloned.id).toBe(original.id);
            expect(cloned.title).toBe(original.title);

            cloned.title = "Modified";
            expect(original.title).toBe("Original");
            expect(cloned.title).toBe("Modified");
        });

        it("should support updateWith()", async () => {
            const container = new Container();
            container.register(FieldBuilderRegistry);
            container.register(PrivateCmsModelBuilder);
            container.register(PageCmsModelBuilder);
            container.register(PageModelFactory);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Original",
                path: "original",
                content: "Content"
            });

            page.updateWith({
                title: "Updated",
                content: "New Content"
            });

            expect(page.id).toBe("1");
            expect(page.title).toBe("Updated");
            expect(page.path).toBe("original");
            expect(page.content).toBe("New Content");
        });
    });
});
