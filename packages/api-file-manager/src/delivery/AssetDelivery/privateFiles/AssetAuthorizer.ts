import { File } from "~/domain/file/types.js";

export interface AssetAuthorizer {
    authorize(file: File): Promise<void>;
}
