import { describe, expect, it } from "vitest";
import { GetFileContentsByIdUseCase as PublicGetFileContentsByIdUseCase } from "~/exports/api/file-manager/file.js";
import { GetFileContentsByIdUseCase } from "~/features/file/GetFileContentsById/index.js";

describe("public file exports", () => {
    it("export GetFileContentsByIdUseCase as the same abstraction", () => {
        expect(PublicGetFileContentsByIdUseCase).toBe(GetFileContentsByIdUseCase);
    });
});
