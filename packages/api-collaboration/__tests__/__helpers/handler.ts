import { useGraphQLHandler, type UseGraphQLHandlerParams } from "@webiny/testing";
import { PluginsContainer } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { createCollaboration } from "~/index.js";
import { CollabLocatorResolver } from "~/domain/locator/abstractions.js";
import {
    CREATE_COLLAB_THREAD_MUTATION,
    DELETE_COLLAB_MESSAGE_MUTATION,
    DELETE_COLLAB_THREAD_MUTATION,
    GET_COLLAB_THREAD_QUERY,
    LIST_COLLAB_THREADS_QUERY,
    REOPEN_COLLAB_THREAD_MUTATION,
    REPLY_TO_COLLAB_THREAD_MUTATION,
    RESOLVE_COLLAB_THREAD_MUTATION,
    UPDATE_COLLAB_MESSAGE_MUTATION
} from "./graphql.js";

/**
 * A content type used only by tests. It stands in for a real content app (CMS/WB) so the
 * collaboration core can be exercised without seeding a full CMS model + entry.
 */
export const TEST_CONTENT_TYPE = "test.entry";

/**
 * Stub resolver: any anchor exists and is readable. The `label`/`path` mirror the shape a real
 * resolver returns so assertions cover the anchor projection too.
 */
class TestLocatorResolverImpl implements CollabLocatorResolver.Interface {
    public readonly contentType = TEST_CONTENT_TYPE;

    async resolve(): Promise<CollabLocatorResolver.Resolution> {
        return { exists: true, authorized: true, label: "Test Field", path: ["Tab 1"] };
    }
}

const TestLocatorResolver = CollabLocatorResolver.createImplementation({
    implementation: TestLocatorResolverImpl,
    dependencies: []
});

export const createGraphQLHandler = (params: UseGraphQLHandlerParams = {}) => {
    const plugins = new PluginsContainer(params.plugins || []);

    plugins.register(createCollaboration());

    // Register the test stub resolver into the same container.
    plugins.register(
        new ContextPlugin(async context => {
            context.container.register(TestLocatorResolver);
        })
    );

    const handler = useGraphQLHandler({
        ...params,
        permissions: [{ name: "*" }],
        debug: params.debug === undefined ? true : params.debug,
        plugins: plugins.all()
    });

    return {
        handler,
        createCollabThread: handler.createMutation(CREATE_COLLAB_THREAD_MUTATION),
        listCollabThreads: handler.createQuery(LIST_COLLAB_THREADS_QUERY),
        getCollabThread: handler.createQuery(GET_COLLAB_THREAD_QUERY),
        replyToCollabThread: handler.createMutation(REPLY_TO_COLLAB_THREAD_MUTATION),
        resolveCollabThread: handler.createMutation(RESOLVE_COLLAB_THREAD_MUTATION),
        reopenCollabThread: handler.createMutation(REOPEN_COLLAB_THREAD_MUTATION),
        updateCollabMessage: handler.createMutation(UPDATE_COLLAB_MESSAGE_MUTATION),
        deleteCollabMessage: handler.createMutation(DELETE_COLLAB_MESSAGE_MUTATION),
        deleteCollabThread: handler.createMutation(DELETE_COLLAB_THREAD_MUTATION)
    };
};
