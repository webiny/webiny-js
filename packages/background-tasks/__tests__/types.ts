import type { Context as BaseContext } from "~/api/types";

export interface Context extends BaseContext {
    someMockProperty: string;
}
