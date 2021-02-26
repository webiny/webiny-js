import { PbPageSettingsFieldsPlugin } from "../../../types";

export default (): PbPageSettingsFieldsPlugin[] => [
    {
        name: "pb-page-settings-fields-general",
        type: "pb-page-settings-fields",
        fields: `
            general {
                image {
                    src
                }
                tags
                layout
                snippet
            }
    `
    },
    {
        name: "pb-page-settings-fields-seo",
        type: "pb-page-settings-fields",
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
        name: "pb-page-settings-fields-social",
        type: "pb-page-settings-fields",
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
];
