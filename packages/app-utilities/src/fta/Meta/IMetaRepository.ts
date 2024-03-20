import { MetaDTO } from "./Meta";

export interface IMetaRepository {
    get: () => MetaDTO;
    set: (meta: MetaDTO) => Promise<void>;
}
