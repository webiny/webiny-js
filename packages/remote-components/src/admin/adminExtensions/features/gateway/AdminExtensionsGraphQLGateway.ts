import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AdminExtensionsGateway } from "./abstractions.js";
import { LIST_ENABLED_ADMIN_EXTENSIONS } from "./graphql.js";
import { LIST_ADMIN_EXTENSIONS } from "./graphql.js";
import { SET_ADMIN_EXTENSION_ENABLED } from "./graphql.js";
import { DELETE_ADMIN_EXTENSION } from "./graphql.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

interface Envelope<T> {
    data: T | null;
    error: { code: string; message: string } | null;
}

type QueryResponse<TField extends string, T> = {
    adminExtensions: Record<TField, Envelope<T>>;
};

function unwrap<T>(envelope: Envelope<T>): T {
    if (envelope.error) {
        throw new Error(envelope.error.message);
    }
    if (envelope.data === null) {
        throw new Error("The API returned no data.");
    }
    return envelope.data;
}

class AdminExtensionsGraphQLGatewayImpl implements AdminExtensionsGateway.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async listEnabled(kind: AdminExtensionKind): Promise<AdminExtensionDto[]> {
        const response = await this.client.execute<
            QueryResponse<"listEnabledAdminExtensions", AdminExtensionDto[]>
        >({ query: LIST_ENABLED_ADMIN_EXTENSIONS, variables: { kind } });

        return unwrap(response.adminExtensions.listEnabledAdminExtensions);
    }

    async list(): Promise<AdminExtensionDto[]> {
        const response = await this.client.execute<
            QueryResponse<"listAdminExtensions", AdminExtensionDto[]>
        >({ query: LIST_ADMIN_EXTENSIONS });

        return unwrap(response.adminExtensions.listAdminExtensions);
    }

    async setEnabled(id: string, enabled: boolean): Promise<AdminExtensionDto> {
        const response = await this.client.execute<
            QueryResponse<"setAdminExtensionEnabled", AdminExtensionDto>
        >({ query: SET_ADMIN_EXTENSION_ENABLED, variables: { id, enabled } });

        return unwrap(response.adminExtensions.setAdminExtensionEnabled);
    }

    async delete(id: string): Promise<void> {
        const response = await this.client.execute<QueryResponse<"deleteAdminExtension", boolean>>({
            query: DELETE_ADMIN_EXTENSION,
            variables: { id }
        });

        unwrap(response.adminExtensions.deleteAdminExtension);
    }
}

export const AdminExtensionsGraphQLGateway = AdminExtensionsGateway.createImplementation({
    implementation: AdminExtensionsGraphQLGatewayImpl,
    dependencies: [MainGraphQLClient]
});
