import { createHcmsBulkActions } from "@webiny/api-headless-cms-bulk-actions";
import { createHeadlessCmsImportExport } from "@webiny/api-headless-cms-import-export";

export const createHcmsTasks = () => [createHcmsBulkActions(), createHeadlessCmsImportExport()];
