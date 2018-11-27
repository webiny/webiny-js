// @flow
import * as React from "react";
import GeneralSettings from "./components/GeneralSettings";
import type { SettingsPluginType } from "webiny-app-admin/types";
import { ReactComponent as PagesIcon } from "./icons/round-ballot-24px.svg";
import gql from "graphql-tag";

const graphql = String.raw;

const fields = graphql`
    {
        name
        logo {
            src
        }
        favicon {
            src
        }
        social {
            facebook
            twitter
            instagram
        }
    }
`;

export default ({
    name: "settings-general",
    type: "settings",
    title: "General",
    description: "Manage general settings.",
    query: gql`
        query getSettings {
            settings {
                general ${fields}
            }
        }
    `,
    mutation: gql`
        mutation updateSettings($data: GeneralSettingsInput) {
            settings {
                general(data: $data) ${fields}
            }
        }
    `,
    variables: (data: Object) => ({ data: data.general }),
    icon: <PagesIcon />,
    render(props) {
        return <GeneralSettings {...props} />;
    }
}: SettingsPluginType);
