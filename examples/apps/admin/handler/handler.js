import { create } from "@webiny/cloud-function";
import { files } from "@webiny/cloud-function-files";
import { index } from "@webiny/cloud-function-index";

export const handler = create(files(), index());
