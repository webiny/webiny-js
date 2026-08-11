export const LIST_REMOTE_COMPONENTS = /* GraphQL */ `
    query ListRemoteComponents {
        remoteComponents {
            listRemoteComponents {
                data {
                    id
                    name
                    label
                    description
                    status
                    sdkVersion
                    createdOn
                    savedOn
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const GET_REMOTE_COMPONENT = /* GraphQL */ `
    query GetRemoteComponent($id: ID!) {
        remoteComponents {
            getRemoteComponent(id: $id) {
                data {
                    id
                    name
                    label
                    description
                    aiContext
                    source
                    css
                    bundledJs
                    bundledJsSha256
                    bundledCss
                    bundledCssSha256
                    aiPrompt
                    status
                    sdkVersion
                    createdOn
                    savedOn
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const CREATE_REMOTE_COMPONENT = /* GraphQL */ `
    mutation CreateRemoteComponent($data: CreateRemoteComponentInput!) {
        remoteComponents {
            createRemoteComponent(data: $data) {
                data {
                    id
                    name
                    label
                    description
                    aiContext
                    source
                    css
                    status
                    sdkVersion
                    createdOn
                    savedOn
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const UPDATE_REMOTE_COMPONENT = /* GraphQL */ `
    mutation UpdateRemoteComponent($id: ID!, $data: UpdateRemoteComponentInput!) {
        remoteComponents {
            updateRemoteComponent(id: $id, data: $data) {
                data {
                    id
                    name
                    label
                    description
                    aiContext
                    source
                    css
                    bundledJs
                    bundledJsSha256
                    bundledCss
                    bundledCssSha256
                    aiPrompt
                    status
                    sdkVersion
                    savedOn
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const DELETE_REMOTE_COMPONENT = /* GraphQL */ `
    mutation DeleteRemoteComponent($id: ID!) {
        remoteComponents {
            deleteRemoteComponent(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const BUNDLE_REMOTE_COMPONENT = /* GraphQL */ `
    mutation BundleRemoteComponent($id: ID!) {
        remoteComponents {
            bundleRemoteComponent(id: $id) {
                data {
                    id
                    name
                    label
                    bundledJs
                    bundledJsSha256
                    bundledCss
                    bundledCssSha256
                    status
                    savedOn
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const GENERATE_REMOTE_COMPONENT = /* GraphQL */ `
    mutation GenerateRemoteComponent($data: GenerateRemoteComponentInput!) {
        remoteComponents {
            generateRemoteComponent(data: $data) {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const REFINE_REMOTE_COMPONENT = /* GraphQL */ `
    mutation RefineRemoteComponent($data: RefineRemoteComponentInput!) {
        remoteComponents {
            refineRemoteComponent(data: $data) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

// Themes the author can preview a component under. Only versions with a resolved snapshot can
// actually render; selecting one without a snapshot falls back to the active theme.
export const LIST_THEMES = /* GraphQL */ `
    query ListThemesForComponentPreview {
        theme {
            listThemes(limit: 100) {
                data {
                    id
                    version
                    status
                    properties
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

// The active theme's colour-scheme policy, so the preview knows whether to offer light/dark for the
// default "Active theme" selection.
export const GET_ACTIVE_THEME_POLICY = /* GraphQL */ `
    query GetActiveThemePolicyForComponentPreview {
        theme {
            getActiveTheme {
                data {
                    theme {
                        policy
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

// A theme version's token CSS source: the published snapshot when it exists, otherwise the draft
// document (+ policy/settings) so an unpublished draft can be resolved and previewed too.
export const GET_THEME_RESOLVED = /* GraphQL */ `
    query GetThemeResolvedForComponentPreview($id: ID!) {
        theme {
            getTheme(id: $id) {
                data {
                    id
                    version
                    resolved
                    tokens
                    policy
                    settings
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
