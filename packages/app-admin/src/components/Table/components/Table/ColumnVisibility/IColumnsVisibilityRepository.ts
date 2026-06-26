export interface IColumnsVisibilityRepository {
    init(): Promise<void>;
    getVisibility(): Record<string, boolean> | undefined;
    update(value: Record<string, boolean>): Promise<void>;
}
