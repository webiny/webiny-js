import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import {
    AssetRequestFactory as AssetRequestFactoryAbstraction,
    type IAssetRequestFactory
} from "./abstractions.js";

class AssetRequestFactoryImpl implements IAssetRequestFactory {
    create(
        data: AssetRequestFactoryAbstraction.AssetRequestData
    ): AssetRequestFactoryAbstraction.AssetRequest {
        return AssetRequest.create(data);
    }
}

export const AssetRequestFactory = AssetRequestFactoryAbstraction.createImplementation({
    implementation: AssetRequestFactoryImpl,
    dependencies: []
});
