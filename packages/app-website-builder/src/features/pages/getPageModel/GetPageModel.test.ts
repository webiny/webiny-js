import { GetPageModel } from "./GetPageModel.js";

describe("GetPageModel", () => {
    const pageModel = {
        id: "page-model",
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
        name: "Page",
        modelId: "page-model",
        singularApiName: "pageModel",
        pluralApiName: "pagesModel",
        titleFieldId: null,
        descriptionFieldId: null,
        imageFieldId: null
    };

    const gateway = {
        execute: jest.fn().mockResolvedValue(pageModel)
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to get the page model", async () => {
        const { useCase, repository } = GetPageModel.getInstance(gateway);

        expect(repository.getModel()).toBeUndefined();

        await useCase.execute();

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toEqual(pageModel);
    });

    it("should handle gateway errors gracefully", async () => {
        const errorGateway = {
            execute: jest.fn().mockRejectedValue(new Error("Gateway error"))
        };
        const { useCase, repository } = GetPageModel.getInstance(errorGateway);

        expect(repository.getModel()).toBeUndefined();

        await expect(useCase.execute()).rejects.toThrow("Gateway error");

        expect(errorGateway.execute).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toBeUndefined();
    });

    it("should cache the page model after listing", async () => {
        const { useCase, repository } = GetPageModel.getInstance(gateway);

        expect(repository.getModel()).toBeUndefined();

        await useCase.execute();

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toEqual(pageModel);

        // Execute again, it should NOT execute the gateway again
        await useCase.execute();
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(repository.getModel()).toEqual(pageModel);
    });
});
