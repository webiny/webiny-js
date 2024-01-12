import { Request } from "@webiny/handler/types";
import { AssetRequest } from "~/delivery";

export interface AssetRequestResolver {
    resolve(request: Request): Promise<AssetRequest | undefined>;
}
