import { FileManager_5_35_0_001 } from "./migrations/5.35.0/001";
import { PageBuilder_5_35_0_002 } from "~/migrations/5.35.0/002";

export const migrations = () => {
    return [FileManager_5_35_0_001, PageBuilder_5_35_0_002];
};
