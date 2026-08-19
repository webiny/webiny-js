import { createFeature } from "@webiny/feature/api";
import { WbyRemoteComponentModel } from "./domain/WbyRemoteComponentModel.js";
import { RemoteComponentSchema } from "./graphql/RemoteComponentSchema.js";
import { CreateRemoteComponentFeature } from "./features/createComponent/feature.js";
import { GetRemoteComponentFeature } from "./features/getComponent/feature.js";
import { ListRemoteComponentsFeature } from "./features/listComponents/feature.js";
import { UpdateRemoteComponentFeature } from "./features/updateComponent/feature.js";
import { DeleteRemoteComponentFeature } from "./features/deleteComponent/feature.js";
import { BundleRemoteComponentFeature } from "./features/bundleComponent/feature.js";
import { GenerateRemoteComponentFeature } from "./features/generateComponent/feature.js";
import { RefineRemoteComponentFeature } from "./features/refineComponent/feature.js";

export const Extension = createFeature({
    name: "RemoteComponents",
    register(container) {
        container.register(WbyRemoteComponentModel);
        container.register(RemoteComponentSchema);

        CreateRemoteComponentFeature.register(container);
        GetRemoteComponentFeature.register(container);
        ListRemoteComponentsFeature.register(container);
        UpdateRemoteComponentFeature.register(container);
        DeleteRemoteComponentFeature.register(container);
        BundleRemoteComponentFeature.register(container);
        GenerateRemoteComponentFeature.register(container);
        RefineRemoteComponentFeature.register(container);
    }
});
