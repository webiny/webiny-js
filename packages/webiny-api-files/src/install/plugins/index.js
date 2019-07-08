// @flow
import { type InstallPluginType } from "webiny-install/types";
import setupEntities from "./setupEntities";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-files",
    meta: {
        name: "Webiny Files",
        description: "An API for managing database of files of any kind."
    },
    install: setupEntities
};

export default [plugin];
