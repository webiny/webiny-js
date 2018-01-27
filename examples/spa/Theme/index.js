import { Webiny } from "webiny-client";

module.exports = () => {
    console.log("Configuring theme...");

    Webiny.registerModule(
        new Webiny.Module("Webiny/Skeleton/UserMenu", () => import("./UserMenu"))
    );
};
