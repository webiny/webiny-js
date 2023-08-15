import { CmsContext } from "~/types";
import { createExportStructureContext } from "./structure";

export const createExportCrud = (context: CmsContext) => {
    return {
        structure: createExportStructureContext(context)
    };
};
