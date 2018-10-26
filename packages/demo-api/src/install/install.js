// @flow
import config from "./../configs";
import coreInstall from "webiny-api/install";
import cmsInstall from "webiny-api-cms/install";

const installers = [coreInstall, cmsInstall];

export default async () => {
    const context = { config };
    try {
        for (let i = 0; i < installers.length; i++) {
            const installer = installers[i];
            await installer(context);
        }
    } catch (e) {
        console.log(e);
    }
    process.exit();
};
