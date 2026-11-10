import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { LayoutsRepository } from "../shared/abstractions.js";
import { CreateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateLayoutUseCase } from "./CreateLayoutUseCase.js";

describe("CreateLayoutUseCase", () => {
    const createUseCase = () => {
        const repository = { create: vi.fn(async (data: any) => ({ id: "new#0001", ...data })) };
        const container = new Container();
        container.registerInstance(LayoutsRepository, repository as any);
        container.register(CreateLayoutUseCase);
        return { useCase: container.resolve(UseCaseAbstraction), repository };
    };

    it("sends the title, the slug and the language", async () => {
        const { useCase, repository } = createUseCase();
        await useCase.execute({ title: " Blog ", slug: " blog-post ", language: "en" });
        expect(repository.create).toHaveBeenCalledWith({
            title: "Blog",
            slug: "blog-post",
            language: "en"
        });
    });

    it("leaves out an empty slug, for the API to make one", async () => {
        const { useCase, repository } = createUseCase();
        await useCase.execute({ title: "Blog", slug: "" });
        expect(repository.create).toHaveBeenCalledWith({ title: "Blog", language: null });
    });
});
