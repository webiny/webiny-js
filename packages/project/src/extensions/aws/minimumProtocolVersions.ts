/**
 * TLS security policies CloudFront accepts for `minimumProtocolVersion`.
 * Pulumi types the property as a plain string, so the accepted values are
 * listed here to keep the public configuration typed.
 */
export const minimumProtocolVersions = [
    "SSLv3",
    "TLSv1",
    "TLSv1_2016",
    "TLSv1.1_2016",
    "TLSv1.2_2018",
    "TLSv1.2_2019",
    "TLSv1.2_2021"
] as const;

export type MinimumProtocolVersion = (typeof minimumProtocolVersions)[number];
