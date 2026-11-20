import { type CreateLayoutData, LayoutsRepository } from "../shared/abstractions.js";
import { CreateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class CreateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    async execute(data: CreateLayoutData) {
        const title = (data.title ?? "").trim();
        if (!title) {
            throw new Error("A layout needs a title.");
        }

        const language = data.language ? data.language.trim() : null;
        // Left out, the API makes the slug from the title.
        const slug = data.slug ? data.slug.trim() : "";

        return this.repository.create({
            title,
            ...(slug ? { slug } : {}),
            language: language || null
        });
    }
}

export const CreateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
