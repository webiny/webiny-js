import { AbstractConstructor } from "./types";

import { useContainer } from "./useContainer";

export function useService<T>(service: AbstractConstructor<T>): T;
export function useService<T>(
    service: AbstractConstructor<T>,
    opts: { optional: boolean }
): T | null;
export function useService<T>(
    service: AbstractConstructor<T>,
    opts?: { optional: boolean }
): T | null {
    return useContainer().inject(service, opts as any);
}
