import { CmsContext } from "~/types";
import { createExportStructureContext } from "./exporting";

export const createExportCrud = (context: CmsContext) => {
    return {
        structure: createExportStructureContext(context)
    };
};
