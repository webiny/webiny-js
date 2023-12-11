import { Request } from "@webiny/handler/types";
import { AssetRequest } from "../AssetRequest";

export interface AssetRequestResolver {
    resolve(request: Request): Promise<AssetRequest | undefined>;
}
