import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperator } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperator.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

class CustomOperator implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "custom";
    }

    public apply(): void {
        return;
    }
}

const CustomOperatorImpl = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: CustomOperator,
    dependencies: []
});

/**
 * The handlers register the OpenSearch core once, in the root container, and extensions register in
 * each request's child container. An operator an extension adds must show up in that request's
 * registry, and only there.
 */
describe("OpenSearch query builder operator registry", () => {
    it("includes operators registered in the request container", () => {
        const root = new Container();
        OpenSearchQueryBuilderOperatorFeature.register(root);

        const withExtension = root.createChildContainer();
        withExtension.register(CustomOperatorImpl);
        const without = root.createChildContainer();

        const extensionRegistry = withExtension.resolve(OpenSearchQueryBuilderOperatorRegistry);
        const otherRegistry = without.resolve(OpenSearchQueryBuilderOperatorRegistry);
        const rootRegistry = root.resolve(OpenSearchQueryBuilderOperatorRegistry);

        expect(extensionRegistry.get("custom")).toBeInstanceOf(CustomOperator);
        expect(extensionRegistry.get("eq")).toBeDefined();
        expect(otherRegistry.get("custom")).toBeUndefined();
        expect(rootRegistry.get("custom")).toBeUndefined();
    });
});
