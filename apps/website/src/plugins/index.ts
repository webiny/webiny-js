import { plugins } from "@webiny/plugins";
import imageComponent from "@webiny/app/plugins/image";
import apolloLinks from "./apolloLinks";
import pageBuilder from "./pageBuilder";
import formBuilder from "./formBuilder";
import dynamicPages from "./dynamicPages";

import theme from "theme";

plugins.register([
    imageComponent(),
    pageBuilder,
    formBuilder,
    dynamicPages,
    apolloLinks(),
    theme()
]);
