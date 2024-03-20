import { Meta } from "~/domain/Meta";

export interface IMetaGetController {
    execute: () => Promise<Meta>;
}
