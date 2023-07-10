import { plugins } from "@webiny/plugins";
import imageComponent from "@webiny/app/plugins/image";
import apolloLinks from "./apolloLinks";
import pageBuilder from "./pageBuilder";
import formBuilder from "./formBuilder";
import projectPlugins from "../../../../../plugins/website";

const projectLegacyPlugins = projectPlugins()
    // @ts-ignore
    .props.children.filter(component => typeof component.type.createLegacyPlugin === "function")
    // @ts-ignore
    .map(component => component.type.createLegacyPlugin(component.props));

plugins.register([imageComponent(), pageBuilder, formBuilder, apolloLinks(), projectLegacyPlugins]);
