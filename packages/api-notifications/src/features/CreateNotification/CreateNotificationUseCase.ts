import { CreateNotificationUseCase as UseCase } from "./abstractions.js";
import { NotificationRepository } from "~/domain/notification/abstractions.js";

class CreateNotificationUseCaseImpl implements UseCase.Interface {
    constructor(private repository: NotificationRepository.Interface) {}

    async execute(input: UseCase.Input) {
        return this.repository.create({
            recipientId: input.recipientId,
            type: input.type,
            actor: input.actor,
            title: input.title,
            snippet: input.snippet ?? null,
            link: input.link ?? null,
            read: false,
            archived: false
        });
    }
}

export const CreateNotificationUseCase = UseCase.createImplementation({
    implementation: CreateNotificationUseCaseImpl,
    dependencies: [NotificationRepository]
});
