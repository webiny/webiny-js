/**
 * A small GraphQL + blob client for the baseline scripts.
 *
 * Environment: WEBINY_API_URL (the instance's /graphql endpoint) and WEBINY_API_TOKEN (an API key with
 * component-extraction access). Neither has a default: these scripts start paid runs, and pointing one
 * at the wrong instance by accident should not be possible.
 */

export const createClient = () => {
  const api = process.env.WEBINY_API_URL;
  const token = process.env.WEBINY_API_TOKEN;
  if (!api || !token) {
    throw new Error("Set WEBINY_API_URL and WEBINY_API_TOKEN.");
  }
  const origin = new URL(api).origin;

  const gql = async (query, variables = {}) => {
    const response = await fetch(api, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables })
    });
    const body = await response.json();
    if (body.errors?.length) {
      throw new Error(body.errors.map(error => error.message).join("; "));
    }
    return body.data;
  };

  /** Unwraps the `{ data, error }` envelope every component-extraction field returns. */
  const field = async (name, query, variables) => {
    const data = await gql(query, variables);
    const envelope = data[name];
    if (envelope?.error) {
      throw new Error(`${name}: ${envelope.error.message}`);
    }
    return envelope?.data ?? null;
  };

  /**
   * A run's blob through the auth-gated run routes: `image` for screenshots, crops and renders, `tree`
   * for captured page trees. The route answers with a redirect to a pre-signed URL; `fetch` follows
   * it and drops the bearer token on the way, as it should.
   */
  const blob = async (runId, ref, kind = "image") => {
    const url = `${origin}/_webiny/component-extraction/run/${encodeURIComponent(runId)}/${kind}?ref=${encodeURIComponent(ref)}`;
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(`${kind} ${ref}: HTTP ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  };

  return { gql, field, blob };
};

export const RUN_FIELDS = `id jobId runNumber status counts createdOn
    stages { stage status stageVersion artifacts startedOn finishedOn error taskId modelUsage }`;

export const getRun = (client, runId) =>
  client.field(
    "componentExtractionGetRun",
    `query ($runId: ID!) { componentExtractionGetRun(runId: $runId) { data { ${RUN_FIELDS} } error { message } } }`,
    { runId }
  );

export const getStageArtifact = (client, runId, stage) =>
  client.field(
    "componentExtractionGetStageArtifact",
    `query ($runId: ID!, $stage: String!) { componentExtractionGetStageArtifact(runId: $runId, stage: $stage) { data error { message } } }`,
    { runId, stage }
  );

export const listModelCalls = async (client, runId) =>
  (await client.field(
    "componentExtractionListModelCalls",
    `query ($runId: ID!) { componentExtractionListModelCalls(runId: $runId) { data error { message } } }`,
    { runId }
  )) ?? [];

export const getRenders = (client, runId) =>
  client.field(
    "componentExtractionGetRenders",
    `query ($runId: ID!) { componentExtractionGetRenders(runId: $runId) { data error { message } } }`,
    { runId }
  );

export const getGeneratedComponent = (client, runId, signature) =>
  client.field(
    "componentExtractionGetGeneratedComponent",
    `query ($runId: ID!, $signature: String!) { componentExtractionGetGeneratedComponent(runId: $runId, signature: $signature) { data error { message } } }`,
    { runId, signature }
  );

/** The human review verdicts recorded in the admin, each component's latest, with the level labels. */
export const getReviews = (client, runId) =>
  client.field(
    "componentExtractionGetReviews",
    `query ($runId: ID!) { componentExtractionGetReviews(runId: $runId) { data error { message } } }`,
    { runId }
  );

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
