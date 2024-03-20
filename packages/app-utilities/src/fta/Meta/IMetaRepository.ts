import { MetaDTO } from "./Meta";

export interface IMetaRepository {
    get: () => MetaDTO;
    set: (meta: MetaDTO) => Promise<void>;
    increaseTotalCount: (count?: number) => Promise<void>;
    decreaseTotalCount: (count?: number) => Promise<void>;
}
