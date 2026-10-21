import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import {
    type CreateLayoutData,
    type Layout,
    type LayoutSettings,
    LayoutsGateway as GatewayAbstraction,
    type UpdateLayoutData
} from "./abstractions.js";
import { LAYOUT_NOT_FOUND_ERROR, LayoutError } from "./errors.js";

const LAYOUT_FIELDS = /* GraphQL */ `
    id
    entryId
    status
    version
    locked
    live {
        version
    }
    properties
    metadata
    elements
    bindings
    extensions
    createdOn
    savedOn
    modifiedOn
    createdBy {
        id
        displayName
    }
    savedBy {
        id
        displayName
    }
`;

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const layoutResponse = (operation: string) => /* GraphQL */ `
    ${operation} {
        data {
            ${LAYOUT_FIELDS}
        }
        ${ERROR_FIELDS}
    }
`;

const LIST_LAYOUTS = /* GraphQL */ `
    query ListLayouts {
        websiteBuilder {
            ${layoutResponse("listLayouts")}
        }
    }
`;

const GET_LAYOUT = /* GraphQL */ `
    query GetLayout($id: ID!) {
        websiteBuilder {
            ${layoutResponse("getLayout(id: $id)")}
        }
    }
`;

const GET_LAYOUT_REVISIONS = /* GraphQL */ `
    query GetLayoutRevisions($entryId: ID!) {
        websiteBuilder {
            ${layoutResponse("getLayoutRevisions(entryId: $entryId)")}
        }
    }
`;

const GET_PAGE_LAYOUT = /* GraphQL */ `
    query GetPageLayout($id: ID!, $language: String) {
        websiteBuilder {
            ${layoutResponse("getPageLayout(id: $id, language: $language)")}
        }
    }
`;

const GET_LAYOUT_SETTINGS = /* GraphQL */ `
    query GetLayoutSettings {
        websiteBuilder {
            getLayoutSettings {
                data {
                    defaultLayout
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const CREATE_LAYOUT = /* GraphQL */ `
    mutation CreateLayout($data: WbLayoutCreateInput!) {
        websiteBuilder {
            ${layoutResponse("createLayout(data: $data)")}
        }
    }
`;

const UPDATE_LAYOUT = /* GraphQL */ `
    mutation UpdateLayout($id: ID!, $data: WbLayoutUpdateInput!) {
        websiteBuilder {
            ${layoutResponse("updateLayout(id: $id, data: $data)")}
        }
    }
`;

const PUBLISH_LAYOUT = /* GraphQL */ `
    mutation PublishLayout($id: ID!) {
        websiteBuilder {
            ${layoutResponse("publishLayout(id: $id)")}
        }
    }
`;

const UNPUBLISH_LAYOUT = /* GraphQL */ `
    mutation UnpublishLayout($id: ID!) {
        websiteBuilder {
            ${layoutResponse("unpublishLayout(id: $id)")}
        }
    }
`;

const CREATE_LAYOUT_REVISION_FROM = /* GraphQL */ `
    mutation CreateLayoutRevisionFrom($id: ID!) {
        websiteBuilder {
            ${layoutResponse("createLayoutRevisionFrom(id: $id)")}
        }
    }
`;

const DELETE_LAYOUT_REVISION = /* GraphQL */ `
    mutation DeleteLayoutRevision($id: ID!) {
        websiteBuilder {
            deleteLayoutRevision(id: $id) {
                data
                ${ERROR_FIELDS}
            }
        }
    }
`;

const DELETE_LAYOUT = /* GraphQL */ `
    mutation DeleteLayout($id: ID!) {
        websiteBuilder {
            deleteLayout(id: $id) {
                data
                ${ERROR_FIELDS}
            }
        }
    }
`;

const DUPLICATE_LAYOUT = /* GraphQL */ `
    mutation DuplicateLayout($id: ID!) {
        websiteBuilder {
            ${layoutResponse("duplicateLayout(id: $id)")}
        }
    }
`;

const TRANSLATE_LAYOUT = /* GraphQL */ `
    mutation TranslateLayout($id: ID!, $language: String!) {
        websiteBuilder {
            ${layoutResponse("translateLayout(id: $id, language: $language)")}
        }
    }
`;

const SET_DEFAULT_LAYOUT = /* GraphQL */ `
    mutation SetDefaultLayout($id: ID) {
        websiteBuilder {
            setDefaultLayout(id: $id) {
                data {
                    defaultLayout
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

interface ErrorDto {
    code: string;
    message: string;
    data: any;
}

type Envelope<T> = { data: T; error: null } | { data: null; error: ErrorDto };

type Response<TOperation extends string, T> = {
    websiteBuilder: Record<TOperation, Envelope<T>>;
};

type LayoutDto = Partial<Layout> & { id: string; entryId: string };

const unwrap = <T>(envelope: Envelope<T>, message: string): T => {
    if (envelope.error) {
        throw new LayoutError({
            message: envelope.error.message || message,
            code: envelope.error.code,
            data: envelope.error.data
        });
    }
    return envelope.data as T;
};

// The API's shape, with defaults for fields that may be empty.
const toLayout = (dto: LayoutDto): Layout => {
    return {
        id: dto.id,
        entryId: dto.entryId,
        status: dto.status ?? "draft",
        version: dto.version ?? 1,
        locked: dto.locked ?? false,
        live: dto.live ?? null,
        properties: { ...dto.properties, title: dto.properties?.title ?? "" },
        metadata: dto.metadata ?? {},
        elements: dto.elements ?? {},
        bindings: dto.bindings ?? {},
        extensions: dto.extensions ?? {},
        createdOn: dto.createdOn ?? null,
        savedOn: dto.savedOn ?? null,
        modifiedOn: dto.modifiedOn ?? null,
        createdBy: dto.createdBy ?? null,
        savedBy: dto.savedBy ?? null
    };
};

const toSettings = (dto: Partial<LayoutSettings> | null): LayoutSettings => {
    return { defaultLayout: dto?.defaultLayout ?? null };
};

class LayoutsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list() {
        const response = await this.client.execute<Response<"listLayouts", LayoutDto[]>>({
            query: LIST_LAYOUTS
        });
        const layouts = unwrap(response.websiteBuilder.listLayouts, "Could not list layouts.");
        return (layouts ?? []).map(toLayout);
    }

    async get(id: string) {
        const response = await this.client.execute<Response<"getLayout", LayoutDto>>({
            query: GET_LAYOUT,
            variables: { id }
        });
        const layout = unwrap(response.websiteBuilder.getLayout, `Could not load layout "${id}".`);
        if (!layout) {
            throw new LayoutError({
                message: `Layout "${id}" was not found.`,
                code: LAYOUT_NOT_FOUND_ERROR,
                data: { id }
            });
        }
        return toLayout(layout);
    }

    async getRevisions(entryId: string) {
        const response = await this.client.execute<Response<"getLayoutRevisions", LayoutDto[]>>({
            query: GET_LAYOUT_REVISIONS,
            variables: { entryId }
        });
        const revisions = unwrap(
            response.websiteBuilder.getLayoutRevisions,
            "Could not load the layout's revisions."
        );
        return (revisions ?? []).map(toLayout);
    }

    async getPageLayout(layoutId: string, language: string | null) {
        const response = await this.client.execute<Response<"getPageLayout", LayoutDto | null>>({
            query: GET_PAGE_LAYOUT,
            variables: { id: layoutId, language: language ?? null }
        });
        const layout = unwrap(
            response.websiteBuilder.getPageLayout,
            `Could not load layout "${layoutId}".`
        );
        return layout ? toLayout(layout) : null;
    }

    async getSettings() {
        const response = await this.client.execute<
            Response<"getLayoutSettings", Partial<LayoutSettings>>
        >({
            query: GET_LAYOUT_SETTINGS
        });
        return toSettings(
            unwrap(response.websiteBuilder.getLayoutSettings, "Could not load layout settings.")
        );
    }

    async create(data: CreateLayoutData) {
        const properties: Record<string, unknown> = { title: data.title };
        if (data.slug) {
            properties.slug = data.slug;
        }
        if (data.language) {
            properties.language = data.language;
        }

        const response = await this.client.execute<Response<"createLayout", LayoutDto>>({
            query: CREATE_LAYOUT,
            variables: { data: { properties } }
        });
        return toLayout(
            unwrap(response.websiteBuilder.createLayout, "Could not create the layout.")
        );
    }

    async update(id: string, data: UpdateLayoutData) {
        const response = await this.client.execute<Response<"updateLayout", LayoutDto>>({
            query: UPDATE_LAYOUT,
            variables: { id, data }
        });
        return toLayout(unwrap(response.websiteBuilder.updateLayout, "Could not save the layout."));
    }

    async publish(id: string) {
        const response = await this.client.execute<Response<"publishLayout", LayoutDto>>({
            query: PUBLISH_LAYOUT,
            variables: { id }
        });
        return toLayout(
            unwrap(response.websiteBuilder.publishLayout, "Could not publish the layout.")
        );
    }

    async unpublish(id: string) {
        const response = await this.client.execute<Response<"unpublishLayout", LayoutDto>>({
            query: UNPUBLISH_LAYOUT,
            variables: { id }
        });
        return toLayout(
            unwrap(response.websiteBuilder.unpublishLayout, "Could not unpublish the layout.")
        );
    }

    async createRevisionFrom(id: string) {
        const response = await this.client.execute<Response<"createLayoutRevisionFrom", LayoutDto>>(
            {
                query: CREATE_LAYOUT_REVISION_FROM,
                variables: { id }
            }
        );
        return toLayout(
            unwrap(
                response.websiteBuilder.createLayoutRevisionFrom,
                "Could not create a new revision."
            )
        );
    }

    async deleteRevision(id: string) {
        const response = await this.client.execute<Response<"deleteLayoutRevision", boolean>>({
            query: DELETE_LAYOUT_REVISION,
            variables: { id }
        });
        unwrap(response.websiteBuilder.deleteLayoutRevision, "Could not delete the revision.");
    }

    async delete(entryId: string) {
        const response = await this.client.execute<Response<"deleteLayout", boolean>>({
            query: DELETE_LAYOUT,
            variables: { id: entryId }
        });
        unwrap(response.websiteBuilder.deleteLayout, "Could not delete the layout.");
    }

    async duplicate(id: string) {
        const response = await this.client.execute<Response<"duplicateLayout", LayoutDto>>({
            query: DUPLICATE_LAYOUT,
            variables: { id }
        });
        return toLayout(
            unwrap(response.websiteBuilder.duplicateLayout, "Could not duplicate the layout.")
        );
    }

    async translate(id: string, language: string) {
        const response = await this.client.execute<Response<"translateLayout", LayoutDto>>({
            query: TRANSLATE_LAYOUT,
            variables: { id, language }
        });
        return toLayout(
            unwrap(response.websiteBuilder.translateLayout, "Could not translate the layout.")
        );
    }

    async setDefaultLayout(entryId: string | null) {
        const response = await this.client.execute<
            Response<"setDefaultLayout", Partial<LayoutSettings>>
        >({
            query: SET_DEFAULT_LAYOUT,
            variables: { id: entryId }
        });
        return toSettings(
            unwrap(response.websiteBuilder.setDefaultLayout, "Could not set the default layout.")
        );
    }
}

export const LayoutsGateway = GatewayAbstraction.createImplementation({
    implementation: LayoutsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
