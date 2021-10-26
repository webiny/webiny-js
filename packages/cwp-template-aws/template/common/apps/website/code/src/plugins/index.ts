import { plugins } from "@webiny/plugins";
import imageComponent from "@webiny/app/plugins/image";
import pageBuilder from "./pageBuilder";
import formBuilder from "./formBuilder";
import apolloLinks from "./apolloLinks";

import theme from "theme";

plugins.register([imageComponent(), pageBuilder, formBuilder, apolloLinks(), theme()]);
