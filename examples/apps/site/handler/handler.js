import { create } from "@webiny/cloud-function";
import { files } from "@webiny/cloud-function-files";
import { ssr } from "@webiny/cloud-function-ssr";

export const handler = create(files(), ssr());
