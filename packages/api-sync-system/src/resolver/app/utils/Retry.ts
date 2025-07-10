import { sleep } from "./sleep";

export interface IRetryableRetryOptions {
    onFail?: (error: Error) => Promise<void> | void;
}

export interface IRetryable {
    retry<T>(fn: () => Promise<T>, options: IRetryableRetryOptions): Promise<T>;
}

export interface IRetryParams {
    maxRetries: number;
    retryDelay: number;
}

export class Retry implements IRetryable {
    private readonly maxRetries: number;
    private readonly retryDelay: number;
    private retryCount: number = 0;

    public constructor(params: IRetryParams) {
        this.maxRetries = params.maxRetries;
        this.retryDelay = params.retryDelay;
    }

    public async retry<T>(fn: () => Promise<T>, options?: IRetryableRetryOptions): Promise<T> {
        try {
            return await fn();
        } catch (ex) {
            if (this.retryCount >= this.maxRetries) {
                if (options?.onFail) {
                    await options.onFail(ex as Error);
                }
                throw ex;
            }
        }
        this.retryCount++;
        await sleep(this.retryDelay);
        const result = await this.retry<T>(fn, options);
        this.retryCount = 0;
        return result;
    }
}

export const createRetry = (params: IRetryParams): IRetryable => {
    return new Retry(params);
};
