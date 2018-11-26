// @flow
import {
    general as pageSettingsGeneral,
    seo as pageSettingsSeo,
    social as pageSettingsSocial
} from "./pageSettings/";

export default [...pageSettingsGeneral, ...pageSettingsSeo, ...pageSettingsSocial];
