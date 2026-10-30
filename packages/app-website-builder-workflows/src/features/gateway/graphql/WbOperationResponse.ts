/*
 * The response of one operation under the `websiteBuilder` root: the root field name maps to the
 * envelope the shared gateway interface returns.
 */
export interface WbOperationResponse<TName extends string, TEnvelope> {
    websiteBuilder: Record<TName, TEnvelope>;
}
