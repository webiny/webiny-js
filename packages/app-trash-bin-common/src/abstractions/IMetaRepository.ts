import { MetaDTO } from "~/domain/Meta";

export interface IMetaRepository {
    get: () => MetaDTO;
    set: (meta: MetaDTO) => Promise<void>;
}
