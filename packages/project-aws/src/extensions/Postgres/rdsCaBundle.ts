import path from "path";

/**
 * The Amazon RDS CA bundle for every region, as published at
 * https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem.
 *
 * The plain Lambda functions verify the database's certificate with the bundle of their runtime,
 * `/var/runtime/ca-cert.pem`. The web function's runtime doesn't have that file, so the api build
 * puts this bundle into `build-web` and the web function points `NODE_EXTRA_CA_CERTS` at it.
 */
export const RDS_CA_BUNDLE_FILE = "rds-ca-bundle.pem";

/** The bundle as it ships with this package. */
export const RDS_CA_BUNDLE_SOURCE = path.join(import.meta.dirname, RDS_CA_BUNDLE_FILE);

/** Where the bundle is in the web function: Lambda unpacks `build-web` into `/var/task`. */
export const WEB_FUNCTION_RDS_CA_CERTS = `/var/task/${RDS_CA_BUNDLE_FILE}`;
