import { FolderDTO } from "~/Domain/Models";

export interface IGetFolderGateway {
    execute: (id: string) => Promise<FolderDTO>;
}
