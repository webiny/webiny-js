import type { Mock } from "vitest";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";

// The FolderExists use case as a test double: only `execute`, a vitest mock (R355).
export interface FakeFolderExistsUseCase extends FolderExistsUseCase.Interface {
    execute: Mock<FolderExistsUseCase.Interface["execute"]>;
}
