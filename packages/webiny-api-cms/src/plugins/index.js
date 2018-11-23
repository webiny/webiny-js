// @flow
import {
    general as pageSettingsGeneral,
    seo as pageSettingsSeo,
    social as pageSettingsSocial
} from "./pageSettings/";

import {
    general as systemSettingsGeneral,
    social as systemSettingsSocial
} from "./systemSettings/";

export default [
    ...pageSettingsGeneral,
    ...pageSettingsSeo,
    ...pageSettingsSocial,
    ...systemSettingsGeneral,
    ...systemSettingsSocial
];
