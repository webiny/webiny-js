export interface IColumnsVisibilityRepository {
    get(): Record<string, boolean> | undefined;
    update(value: Record<string, boolean>): Promise<void>;
}
