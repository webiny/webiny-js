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
