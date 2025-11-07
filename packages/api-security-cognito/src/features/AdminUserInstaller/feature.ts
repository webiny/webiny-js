import { createFeature } from "@webiny/feature/api";
import { AdminUserInstaller } from "./AdminUserInstaller.js";

export const AdminUserInstallerFeature = createFeature({
    name: "AdminUserInstallerFeature",
    register(container) {
        container.register(AdminUserInstaller);
    }
});
