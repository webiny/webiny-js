/**
 * Component-name namespacing — mirror of the API's PromoteHandler. A promoted component is named under
 * its extraction: the job name is sanitised to alphanumerics ("Webiny -4" → "Webiny4") and prefixes the
 * classified name, e.g. "Webiny4/Hero". Kept in sync with
 * `packages/api-component-extraction/src/features/stages/promote/PromoteHandler.ts`.
 */
export const namespaceSegment = (jobName: string): string => jobName.replace(/[^a-zA-Z0-9]+/g, "");

export const qualify = (segment: string, name: string): string =>
    segment ? `${segment}/${name}` : name;
