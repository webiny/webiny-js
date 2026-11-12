import { test } from "@e2e-dev/web";
import { credentials } from "e2e";
import { expect } from "e2e";

/*
 * Covers the whole scheduled publish path on a deployed project: the API creates an EventBridge
 * schedule, EventBridge invokes the GraphQL Lambda at the scheduled time, and the Lambda publishes
 * the entry. In 6.5.0 and 6.5.1 the last step never happened: the Lambda could not find the
 * scheduler's event handler, and the entry stayed a draft with its "Scheduled" badge.
 *
 * `immediately: true` schedules the publish 90 seconds ahead, the soonest the scheduler allows, so
 * the test waits up to four minutes for EventBridge to fire.
 */
const PUBLISH_TIMEOUT = 240_000;

interface ApiAccess {
    apiUrl: string;
    authorization: string;
}

interface GraphQLResponse<T> {
    data?: T;
    errors?: { message: string }[];
}

const graphql = async <T>(
    access: ApiAccess,
    path: string,
    query: string,
    variables: Record<string, unknown> = {}
): Promise<T> => {
    const response = await fetch(`${access.apiUrl}${path}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: access.authorization
        },
        body: JSON.stringify({ query, variables })
    });
    const body = (await response.json()) as GraphQLResponse<T>;
    if (body.errors?.length) {
        throw new Error(`${path}: ${body.errors.map(error => error.message).join("; ")}`);
    }
    return body.data as T;
};

test(
    "an entry scheduled for publishing is published when the schedule fires",
    { tags: ["scheduler"], timeout: 360_000 },
    async ({ app, screen, browser }) => {
        const admin = credentials.user("admin");

        /*
         * Reuse the admin app's own credentials: the first GraphQL request after sign-in carries the
         * signed-in user's token and the API URL the app was deployed with.
         */
        let access: ApiAccess | undefined;
        await browser.route(/\/graphql$/, async route => {
            const authorization = route.request.headers["authorization"];
            if (!access && authorization) {
                access = {
                    apiUrl: route.request.url.replace(/\/graphql$/, ""),
                    authorization
                };
            }
            await route.fallback();
        });

        await app.open("/");
        await screen.getByLabel("Email").fill(admin.username);
        await screen.getByLabel("Password").fill(admin.password);
        await screen.getByRole("button", "Submit").tap();
        await expect(screen.getByLabel("Password")).toBeHidden({ timeout: 30_000 });

        const hasAccess = () => access !== undefined;
        await expect.poll(hasAccess, { timeout: 30_000 }).toBe(true);
        const api = access!;
        await browser.unrouteAll();

        // Fresh per run, so a model left over from an earlier run never collides.
        const suffix = Date.now().toString(36);
        const modelId = `e2eScheduled${suffix}`;
        const singularApiName = `E2eScheduled${suffix}`;
        const pluralApiName = `E2eScheduleds${suffix}`;

        const groups = await graphql<{
            listContentModelGroups: { data: { id: string; slug: string }[] };
        }>(api, "/cms/manage", "{ listContentModelGroups { data { id slug } } }");
        const group = groups.listContentModelGroups.data.find(item => item.slug === "ungrouped");
        expect(group).toBeTruthy();

        await graphql(
            api,
            "/cms/manage",
            `
                mutation CreateModel($data: CmsContentModelCreateInput!) {
                    createContentModel(data: $data) {
                        error {
                            message
                        }
                    }
                }
            `,
            {
                data: {
                    name: `E2E scheduled ${suffix}`,
                    modelId,
                    singularApiName,
                    pluralApiName,
                    group: group!.id,
                    fields: [
                        {
                            id: "title",
                            fieldId: "title",
                            type: "text",
                            label: "Title"
                        }
                    ],
                    layout: [["title"]],
                    titleFieldId: "title"
                }
            }
        );

        const created = await graphql<Record<string, { data: { id: string } }>>(
            api,
            "/cms/manage",
            `mutation CreateEntry($data: ${singularApiName}Input!) {
                create${singularApiName}(data: $data) { data { id } error { message } }
            }`,
            { data: { values: { title: "Scheduled by the e2e test" } } }
        );
        const entryId = created[`create${singularApiName}`].data.id;

        const scheduled = await graphql<{
            scheduler: { scheduleAction: { data: { id: string } | null; error: unknown } };
        }>(
            api,
            "/graphql",
            `
                mutation Schedule($namespace: String!, $targetId: ID!) {
                    scheduler {
                        scheduleAction(
                            namespace: $namespace
                            targetId: $targetId
                            actionType: publish
                            immediately: true
                        ) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }
                }
            `,
            { namespace: `Cms/Entry/${modelId}`, targetId: entryId }
        );
        expect(scheduled.scheduler.scheduleAction.error).toBeNull();

        const readStatus = async () => {
            const entry = await graphql<
                Record<string, { data: { meta: { status: string } } | null }>
            >(
                api,
                "/cms/manage",
                `query GetEntry($revision: ID!) {
                    get${singularApiName}(revision: $revision) { data { meta { status } } }
                }`,
                { revision: entryId }
            );
            return entry[`get${singularApiName}`].data?.meta.status;
        };
        await expect
            .poll(readStatus, {
                timeout: PUBLISH_TIMEOUT,
                interval: 10_000,
                message: `${entryId} was not published by its schedule`
            })
            .toBe("published");

        // Leave nothing behind on a long-lived project. A fresh CI deploy is removed anyway.
        await graphql(
            api,
            "/cms/manage",
            `mutation DeleteEntry($revision: ID!) {
                delete${singularApiName}(revision: $revision, options: { permanently: true }) {
                    data
                }
            }`,
            { revision: entryId }
        );
        await graphql(
            api,
            "/cms/manage",
            `
                mutation DeleteModel($modelId: ID!) {
                    deleteContentModel(modelId: $modelId) {
                        data
                    }
                }
            `,
            { modelId }
        );
    }
);
