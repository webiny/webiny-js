/** Return a full stack name for a given environment and app variant. */
export function getStackName(args: { env: string; variant?: string }) {
    return args.variant ? `${args.env}.${args.variant}` : args.env;
}
