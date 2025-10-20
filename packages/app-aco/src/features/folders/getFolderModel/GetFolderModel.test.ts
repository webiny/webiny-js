import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetFolderModel } from "./GetFolderModel.js";
import type { IGetFolderModelGateway } from "~/features/folders/getFolderModel/IGetFolderModelGateway.js";
import type { FolderModelDto } from "~/features/index.js";

describe("GetFolderModel", () => {
    const mockFolderModel = {
        id: "folder-model",
        group: "custom-group",
        version: "0.0.0",
        fields: [
            {
                id: "field1",
                label: "Field 1",
                type: "string",
                fieldId: "field1"
            },
            {
                id: "field2",
                label: "Field 2",
                type: "string",
                fieldId: "field2"
            }
        ],
        lockedFields: [],
        icon: "icon",
        name: "Folder",
        modelId: "folder-model",
        singularApiName: "folderModel",
        pluralApiName: "foldersModel",
        titleFieldId: null,
        descriptionFieldId: null,
        imageFieldId: null
    } as unknown as FolderModelDto;

    class GetFolderModelMockGateway implements IGetFolderModelGateway {
        async execute() {
            return mockFolderModel;
        }
    }

    const gateway = new GetFolderModelMockGateway();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should be able to get the folders model", async () => {
        const spy = vi.spyOn(gateway, "execute");

        const { useCase, repository } = GetFolderModel.getInstance(gateway);

        expect(repository.getModel()).toBeUndefined();

        await useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toEqual(mockFolderModel);
    });

    it("should handle gateway errors gracefully", async () => {
        class GetFolderModelErrorMockGateway implements IGetFolderModelGateway {
            async execute(): Promise<FolderModelDto> {
                throw new Error("Gateway error");
            }
        }

        const errorGateway = new GetFolderModelErrorMockGateway();

        const spy = vi.spyOn(errorGateway, "execute");

        const { useCase, repository } = GetFolderModel.getInstance(errorGateway);

        expect(repository.getModel()).toBeUndefined();

        await expect(useCase.execute()).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toBeUndefined();
    });

    it("should cache folders model after listing", async () => {
        const { useCase, repository } = GetFolderModel.getInstance(gateway);

        expect(repository.getModel()).toBeUndefined();

        await useCase.execute();

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toEqual(mockFolderModel);

        // Execute again, it should NOT execute the gateway again
        await useCase.execute();
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toEqual(mockFolderModel);
    });
});
