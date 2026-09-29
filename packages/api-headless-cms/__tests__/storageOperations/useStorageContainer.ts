import { beforeEach } from "vitest";
import type { Container } from "@webiny/di";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

/**
 * Registers the handler and returns a getter for the DI container of the current test.
 * Storage operations are created during context initialization, so a query runs first.
 */
export const useStorageContainer = (): (() => Container) => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    beforeEach(async () => {
        await handler.isInstalledQuery();
        container = handler.getContext().container;
    });

    return () => container;
};
