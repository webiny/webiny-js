export type HostingType = "aws" | "standalone";

/*
 * What an extension definition declares in `tags.hosting`: the one hosting type it works in, or
 * "all" for every hosting type.
 */
export type ExtensionHosting = HostingType | "all";
