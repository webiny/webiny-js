// @flow
import {
    general as pageSettingsGeneral,
    seo as pageSettingsSeo,
    social as pageSettingsSocial
} from "./pageSettings/";

import cmsSettings from "./cmsSettings";

export default [...pageSettingsGeneral, ...pageSettingsSeo, ...pageSettingsSocial, ...cmsSettings];
