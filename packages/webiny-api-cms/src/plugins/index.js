// @flow
import {
    general as pageSettingsGeneral,
    seo as pageSettingsSeo,
    social as pageSettingsSocial
} from "./pageSettings/";

import {
    general as websiteSettingsGeneral,
    social as websiteSettingsSocial
} from "./websiteSettings/";

export default [
    ...pageSettingsGeneral,
    ...pageSettingsSeo,
    ...pageSettingsSocial,
    ...websiteSettingsGeneral,
    ...websiteSettingsSocial
];
