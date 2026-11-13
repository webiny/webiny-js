import { describe, it, expect } from "vitest";
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

    // React runs the new view's effect before or after the old view's cleanup, depending on the tree.
    it("ignores a clear from a view that was already replaced", () => {
        const pageContext = setup();

        const leaving = pageContext.set(products);
        pageContext.set(articles);
        pageContext.clear(leaving);

        expect(pageContext.get()).toEqual(articles);
    });
});
