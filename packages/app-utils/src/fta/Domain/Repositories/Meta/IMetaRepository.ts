import { Meta } from "../../Models";

export interface IMetaRepository {
    get: () => Meta;
    set: (meta: Meta) => Promise<void>;
    increaseTotalCount: (count?: number) => Promise<void>;
    decreaseTotalCount: (count?: number) => Promise<void>;
}
