import { createFeature } from "@webiny/feature/api";
import AddCmsPermissions from "./AddCmsPermissions.js";

export const AddCmsPermissionsFeature = createFeature({
    name: "AddCmsPermissions",
    register(container) {
        container.register(AddCmsPermissions);
    }
});
