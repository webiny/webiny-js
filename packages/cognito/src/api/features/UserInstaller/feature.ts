import { createFeature } from "@webiny/feature/api";
import { UserInstaller } from "./UserInstaller.js";

export const AdminUserInstallerFeature = createFeature({
    name: "AdminUserInstallerFeature",
    register(container) {
        container.register(UserInstaller);
    }
});
