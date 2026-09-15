/**
 * Models are addressed as `"<sdkName>/<modelId>"`, e.g. `"anthropic/claude-sonnet-4-5"`.
 *
 * The vendor half has to be recoverable from the string on its own, because a stored role holds the
 * composite and nothing else: resolving checks that the model's vendor matches the connection's
 * before spending a request to find out.
 *
 * Shared rather than owned by `Connections`, because it is a fact about the model id format and
 * both `Connections` and `Capabilities` read it.
 */
export const sdkNameFromModel = (model: string | undefined): string =>
    (model ?? "").split("/")[0] ?? "";
