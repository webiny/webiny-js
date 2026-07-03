import { createFeature } from "@webiny/feature/api";
import { UserInstaller } from "./UserInstaller.js";

export const UserInstallerFeature = createFeature({
    name: "UserInstallerFeature",
    register(container) {
        container.register(UserInstaller);
    }
});
