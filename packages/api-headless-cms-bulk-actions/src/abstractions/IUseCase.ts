export interface IUseCase<TInput, TOutput> {
    execute(params: TInput): Promise<TOutput>;
}
