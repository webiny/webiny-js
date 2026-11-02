import type { Container } from "@webiny/di";
import { registerFakeGetFolderRepository } from "./fakeFolders/FakeGetFolderRepository.js";
import { registerFakeGetAncestors } from "./fakeFolders/FakeGetAncestors.js";

export type { TestFolderParams } from "./fakeFolders/testFolders.js";
export { addTestFolder, failingFolderReads, testFolders } from "./fakeFolders/testFolders.js";

/**
 * The two ACO folder abstractions the CMS folder port reads (ACO is not part of the harness).
 * Registered by default in `createContextHandler`.
 */
export const registerFakeFolders = (container: Container) => {
    registerFakeGetFolderRepository(container);
    registerFakeGetAncestors(container);
};
