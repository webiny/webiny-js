import { PluginsContainer } from "@webiny/plugins";

export interface Benchmark {
    measure: <T = any>(name: string, cb: () => Promise<T>) => Promise<T>;
}
export interface BenchmarkMeasurement {
    name: string;
    start: Date;
    end: Date;
    elapsed: number;
    memory: number;
}
/**
 * The main context which is constructed on every request.
 * All other contexts should extend or augment this one.
 */
export interface Context {
    plugins: PluginsContainer;
    args: any;
    readonly WEBINY_VERSION: string;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     */
    hasResult: () => boolean;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     *
     * @private
     */
    _result?: any;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     */
    setResult: (value: any) => void;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     */
    getResult: () => void;
    /**
     * Wait for property to be defined on the object and then execute the callable.
     * In case of multiple objects defined, wait for all of them.
     */
    waitFor: <T extends Context = Context>(
        obj: string[] | string,
        cb: (context: T) => void
    ) => void;

    benchmark: Benchmark;
}
