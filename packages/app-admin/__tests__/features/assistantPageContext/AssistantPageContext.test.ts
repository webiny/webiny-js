import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AssistantPageContext } from "~/features/assistantPageContext/AssistantPageContext.js";
import { AssistantPageContext as Abstraction } from "~/features/assistantPageContext/abstractions.js";

const products = { view: "Entries of the Product content model", details: { modelId: "product" } };
const articles = { view: "Entries of the Article content model", details: { modelId: "article" } };

const setup = () => {
    const container = new Container();
    container.register(AssistantPageContext).inSingletonScope();
    return container.resolve(Abstraction);
};

describe("AssistantPageContext", () => {
    it("holds the context last set, until its owner clears it", () => {
        const pageContext = setup();

        const owner = pageContext.set(products);
        expect(pageContext.get()).toEqual(products);

        pageContext.clear(owner);
        expect(pageContext.get()).toBeNull();
    });

    // A view disposed after the next one started must not take the newer context with it.
    it("keeps the newer context when an older owner clears late", () => {
        const pageContext = setup();

        const leaving = pageContext.set(products);
        pageContext.set(articles);
        pageContext.clear(leaving);

        expect(pageContext.get()).toEqual(articles);
    });

    it("hands the page's context back when a view over it clears", () => {
        const pageContext = setup();

        pageContext.set(products);
        const drawer = pageContext.set(articles);
        pageContext.clear(drawer);

        expect(pageContext.get()).toEqual(products);
    });
});
