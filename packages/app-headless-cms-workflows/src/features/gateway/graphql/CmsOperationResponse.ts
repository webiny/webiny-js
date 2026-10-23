/*
 * The response of one operation under the `cms` root: the root field name maps to the envelope
 * the shared gateway interface returns.
 */
export interface CmsOperationResponse<TName extends string, TEnvelope> {
    cms: Record<TName, TEnvelope>;
}
