import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ThemeGateway as GatewayAbstraction,
    ThemeGraphQLError,
    type ActivateThemeResultDto,
    type ActiveThemePointerDto,
    type CreateThemeInputDto,
    type ExtractionStartedDto,
    type ExtractionStatusDto,
    type ExtractThemeInputDto,
    type PublishThemeResultDto,
    type ThemeDto,
    type ThemeRevisionDto,
    type UpdateThemeInputDto
} from "./abstractions.js";

const IDENTITY_FIELDS = /* GraphQL */ `
    id
    displayName
    type
`;

const THEME_FIELDS = /* GraphQL */ `
    id
    entryId
    status
    version
    locked
    createdOn
    savedOn
    lastPublishedOn
    createdBy { ${IDENTITY_FIELDS} }
    savedBy { ${IDENTITY_FIELDS} }
    properties
    tokens
    policy
    settings
    resolved
    metadata
    extensions
`;

const POINTER_FIELDS = /* GraphQL */ `
    entryId
    id
    version
    activatedOn
    activatedBy { ${IDENTITY_FIELDS} }
`;

const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

interface Envelope<T> {
    data: T | null;
    error: { code: string; message: string; data: Record<string, unknown> | null } | null;
}

const LIST_THEMES = /* GraphQL */ `
    query ListThemes {
        theme { listThemes { data { ${THEME_FIELDS} } error { ${ERROR_FIELDS} } } }
    }
`;

const GET_THEME = /* GraphQL */ `
    query GetTheme($id: ID!) {
        theme { getTheme(id: $id) { data { ${THEME_FIELDS} } error { ${ERROR_FIELDS} } } }
    }
`;

const GET_REVISIONS = /* GraphQL */ `
    query GetThemeRevisions($entryId: String!) {
        theme {
            getThemeRevisions(entryId: $entryId) {
                data {
                    id entryId version name status locked savedOn createdOn lastPublishedOn
                    createdBy { ${IDENTITY_FIELDS} }
                }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

const GET_ACTIVE = /* GraphQL */ `
    query GetActiveTheme {
        theme {
            getActiveTheme {
                data { theme { ${THEME_FIELDS} } pointer { ${POINTER_FIELDS} } }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

const CREATE_THEME = /* GraphQL */ `
    mutation CreateTheme($data: ThemeCreateInput!) {
        theme { createTheme(data: $data) { data { ${THEME_FIELDS} } error { ${ERROR_FIELDS} } } }
    }
`;

const UPDATE_THEME = /* GraphQL */ `
    mutation UpdateTheme($id: ID!, $data: ThemeUpdateInput!) {
        theme { updateTheme(id: $id, data: $data) { data { ${THEME_FIELDS} } error { ${ERROR_FIELDS} } } }
    }
`;

const DELETE_THEME = /* GraphQL */ `
    mutation DeleteTheme($id: ID!) {
        theme { deleteTheme(id: $id) { data error { ${ERROR_FIELDS} } } }
    }
`;

const CREATE_REVISION_FROM = /* GraphQL */ `
    mutation CreateThemeRevisionFrom($id: ID!) {
        theme { createThemeRevisionFrom(id: $id) { data { ${THEME_FIELDS} } error { ${ERROR_FIELDS} } } }
    }
`;

const PUBLISH_THEME = /* GraphQL */ `
    mutation PublishTheme($id: ID!) {
        theme {
            publishTheme(id: $id) {
                data { theme { ${THEME_FIELDS} } warnings { code path message } }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

const ACTIVATE_THEME = /* GraphQL */ `
    mutation ActivateTheme($id: ID!) {
        theme {
            activateTheme(id: $id) {
                data {
                    theme { ${THEME_FIELDS} }
                    pointer { ${POINTER_FIELDS} }
                    previous { ${POINTER_FIELDS} }
                }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

const DEACTIVATE_THEME = /* GraphQL */ `
    mutation DeactivateTheme {
        theme { deactivateTheme { data { previous { ${POINTER_FIELDS} } } error { ${ERROR_FIELDS} } } }
    }
`;

const EXTRACT_THEME = /* GraphQL */ `
    mutation ExtractTheme($data: ThemeExtractionInput!) {
        theme {
            extractTheme(data: $data) {
                data { taskId extractionId }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

const GET_EXTRACTION = /* GraphQL */ `
    query GetThemeExtraction($taskId: ID!) {
        theme {
            getThemeExtraction(taskId: $taskId) {
                data { taskId state themeId entryUrl sampledUrls error }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

const ABORT_EXTRACTION = /* GraphQL */ `
    mutation AbortThemeExtraction($taskId: ID!) {
        theme {
            abortThemeExtraction(taskId: $taskId) {
                data { taskId }
                error { ${ERROR_FIELDS} }
            }
        }
    }
`;

class ThemeGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list() {
        return this.run<ThemeDto[]>(LIST_THEMES, {}, response => response.theme.listThemes) ?? [];
    }

    async get(id: string) {
        return this.run<ThemeDto>(GET_THEME, { id }, response => response.theme.getTheme);
    }

    async getRevisions(entryId: string) {
        return this.run<ThemeRevisionDto[]>(
            GET_REVISIONS,
            { entryId },
            response => response.theme.getThemeRevisions
        );
    }

    async getActive() {
        return this.run<{ theme: ThemeDto | null; pointer: ActiveThemePointerDto | null }>(
            GET_ACTIVE,
            {},
            response => response.theme.getActiveTheme
        );
    }

    async create(data: CreateThemeInputDto) {
        return this.run<ThemeDto>(CREATE_THEME, { data }, response => response.theme.createTheme);
    }

    async update(id: string, data: UpdateThemeInputDto) {
        return this.run<ThemeDto>(
            UPDATE_THEME,
            { id, data },
            response => response.theme.updateTheme
        );
    }

    async remove(id: string) {
        await this.run<boolean>(DELETE_THEME, { id }, response => response.theme.deleteTheme);
    }

    async createRevisionFrom(id: string) {
        return this.run<ThemeDto>(
            CREATE_REVISION_FROM,
            { id },
            response => response.theme.createThemeRevisionFrom
        );
    }

    async publish(id: string) {
        return this.run<PublishThemeResultDto>(
            PUBLISH_THEME,
            { id },
            response => response.theme.publishTheme
        );
    }

    async activate(id: string) {
        return this.run<ActivateThemeResultDto>(
            ACTIVATE_THEME,
            { id },
            response => response.theme.activateTheme
        );
    }

    async deactivate() {
        await this.run(DEACTIVATE_THEME, {}, response => response.theme.deactivateTheme);
    }

    async extract(data: ExtractThemeInputDto) {
        return this.run<ExtractionStartedDto>(
            EXTRACT_THEME,
            { data },
            response => response.theme.extractTheme
        );
    }

    async getExtraction(taskId: string) {
        return this.run<ExtractionStatusDto>(
            GET_EXTRACTION,
            { taskId },
            response => response.theme.getThemeExtraction
        );
    }

    async abortExtraction(taskId: string) {
        await this.run(
            ABORT_EXTRACTION,
            { taskId },
            response => response.theme.abortThemeExtraction
        );
    }

    /**
     * One place that unwraps the `{ data, error }` envelope. Errors are rethrown as
     * `ThemeGraphQLError` so `error.data` — which carries the publish blocker list — survives.
     */
    private async run<T>(
        query: string,
        variables: Record<string, unknown>,
        select: (response: any) => Envelope<T>
    ): Promise<T> {
        const response = await this.client.execute<any>({ query, variables });
        const envelope = select(response);

        if (envelope.error) {
            throw new ThemeGraphQLError(
                envelope.error.message,
                envelope.error.code,
                envelope.error.data
            );
        }

        return envelope.data as T;
    }
}

export const ThemeGateway = GatewayAbstraction.createImplementation({
    implementation: ThemeGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
