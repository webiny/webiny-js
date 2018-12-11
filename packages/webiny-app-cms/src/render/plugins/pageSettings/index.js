// @flow
import type { CmsPageSettingsFieldsPluginType } from "webiny-app-cms/types";

export default ([
    {
        name: "cms-page-settings-fields-general",
        type: "cms-page-settings-fields",
        fields: `
            general {
                image {
                    src
                }
                tags {
                    id 
                    name
                }
                layout
            }
    `
    },
    {
        name: "cms-page-settings-fields-seo",
        type: "cms-page-settings-fields",
        fields: `
            seo {
                title
                description
                meta {
                    name
                    content
                }
            }
    `
    },
    {
        name: "cms-page-settings-fields-social",
        type: "cms-page-settings-fields",
        fields: `
            social {
                image {
                    src
                }
                title
                description
                meta {
                    property
                    content
                }
            }
    `
    }
]: Array<CmsPageSettingsFieldsPluginType>);
