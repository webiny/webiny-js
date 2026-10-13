import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperator } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperator.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";
import { OpenSearchIndexFeature } from "~/features/OpenSearchIndex/feature.js";
import { OpenSearchIndex } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndex.js";
import { OpenSearchIndexRegistry } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.js";
import type { OpenSearchIndexRequestBody } from "~/types.js";

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

class CustomIndex implements OpenSearchIndex.Interface {
    public readonly body: OpenSearchIndexRequestBody = {};

    public canUse(): boolean {
        return true;
    }
}

const CustomIndexImpl = OpenSearchIndex.createImplementation({
    implementation: CustomIndex,
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

    it("includes indexes registered in the request container", () => {
        const root = new Container();
        OpenSearchIndexFeature.register(root);

        const withExtension = root.createChildContainer();
        withExtension.register(CustomIndexImpl);
        const without = root.createChildContainer();

        const extensionIndexes = withExtension.resolve(OpenSearchIndexRegistry).getAll();
        const otherIndexes = without.resolve(OpenSearchIndexRegistry).getAll();
        const rootIndexes = root.resolve(OpenSearchIndexRegistry).getAll();

        expect(extensionIndexes).toHaveLength(1);
        expect(extensionIndexes[0]).toBeInstanceOf(CustomIndex);
        expect(otherIndexes).toHaveLength(0);
        expect(rootIndexes).toHaveLength(0);
    });
});
