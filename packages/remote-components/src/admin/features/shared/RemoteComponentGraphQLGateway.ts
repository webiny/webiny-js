import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { RemoteComponentGateway } from "./abstractions.js";
import type { RemoteComponentDto } from "~/shared/types.js";
import {
    LIST_REMOTE_COMPONENTS,
    GET_REMOTE_COMPONENT,
    CREATE_REMOTE_COMPONENT,
    UPDATE_REMOTE_COMPONENT,
    DELETE_REMOTE_COMPONENT,
    GENERATE_REMOTE_COMPONENT,
    REFINE_REMOTE_COMPONENT
} from "./graphql.js";

interface GqlEnvelope<T> {
    data: T | null;
    error: { code: string; message: string } | null;
}

class RemoteComponentGraphQLGatewayImpl implements RemoteComponentGateway.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list() {
        const response = await this.client.execute<{
            remoteComponents: {
                listRemoteComponents: GqlEnvelope<RemoteComponentDto[]> & {
                    meta: { totalCount: number };
                };
            };
        }>({ query: LIST_REMOTE_COMPONENTS });

        const envelope = response.remoteComponents.listRemoteComponents;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return {
            items: envelope.data ?? [],
            meta: { totalCount: envelope.meta.totalCount }
        };
    }

    async get(id: string) {
        const response = await this.client.execute<{
            remoteComponents: {
                getRemoteComponent: GqlEnvelope<RemoteComponentDto>;
            };
        }>({ query: GET_REMOTE_COMPONENT, variables: { id } });

        const envelope = response.remoteComponents.getRemoteComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data!;
    }

    async create(data: Parameters<RemoteComponentGateway.Interface["create"]>[0]) {
        const response = await this.client.execute<{
            remoteComponents: {
                createRemoteComponent: GqlEnvelope<RemoteComponentDto>;
            };
        }>({ query: CREATE_REMOTE_COMPONENT, variables: { data } });

        const envelope = response.remoteComponents.createRemoteComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data!;
    }

    async update(id: string, data: Parameters<RemoteComponentGateway.Interface["update"]>[1]) {
        const response = await this.client.execute<{
            remoteComponents: {
                updateRemoteComponent: GqlEnvelope<RemoteComponentDto>;
            };
        }>({ query: UPDATE_REMOTE_COMPONENT, variables: { id, data } });

        const envelope = response.remoteComponents.updateRemoteComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data!;
    }

    async remove(id: string) {
        const response = await this.client.execute<{
            remoteComponents: {
                deleteRemoteComponent: GqlEnvelope<boolean>;
            };
        }>({ query: DELETE_REMOTE_COMPONENT, variables: { id } });

        const envelope = response.remoteComponents.deleteRemoteComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return true;
    }

    async generate(
        prompt: string,
        options?: {
            name?: string;
            label?: string;
            description?: string;
            additionalFileIds?: string[];
        }
    ) {
        const data: Record<string, unknown> = { prompt };
        if (options) {
            if (options.name) {
                data.name = options.name;
            }
            if (options.label) {
                data.label = options.label;
            }
            if (options.description) {
                data.description = options.description;
            }
            if (options.additionalFileIds && options.additionalFileIds.length > 0) {
                data.additionalFileIds = options.additionalFileIds;
            }
        }

        const response = await this.client.execute<{
            remoteComponents: {
                generateRemoteComponent: GqlEnvelope<{ id: string }>;
            };
        }>({ query: GENERATE_REMOTE_COMPONENT, variables: { data } });

        const envelope = response.remoteComponents.generateRemoteComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data!;
    }

    async refine(data: {
        currentSource: string;
        currentCss: string;
        feedback: string;
        additionalFileIds?: string[];
    }) {
        const response = await this.client.execute<{
            remoteComponents: {
                refineRemoteComponent: GqlEnvelope<boolean>;
            };
        }>({ query: REFINE_REMOTE_COMPONENT, variables: { data } });

        const envelope = response.remoteComponents.refineRemoteComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }
    }
}

export const RemoteComponentGraphQLGateway = RemoteComponentGateway.createImplementation({
    implementation: RemoteComponentGraphQLGatewayImpl,
    dependencies: [MainGraphQLClient]
});
