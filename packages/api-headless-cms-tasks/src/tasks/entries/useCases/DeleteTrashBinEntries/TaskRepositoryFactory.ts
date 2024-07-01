import { TaskRepository } from "./TaskRepository";

export class TaskRepositoryFactory {
    private cache: Map<string, TaskRepository> = new Map();

    getRepository(taskId: string) {
        const cacheKey = this.getCacheKey(taskId);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new TaskRepository());
        }

        return this.cache.get(cacheKey) as TaskRepository;
    }

    private getCacheKey(taskId: string) {
        return taskId;
    }
}

export const taskRepositoryFactory = new TaskRepositoryFactory();
