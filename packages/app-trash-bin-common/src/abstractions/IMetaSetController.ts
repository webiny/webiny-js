import { Meta } from "~/domain/Meta";

export interface IMetaSetController {
    execute: (meta: Meta) => Promise<void>;
}
