export interface FileManagerFsConfig {
    /**
     * Absolute path on the local filesystem where uploaded files are written.
     * In docker-compose this is typically a mounted volume (e.g., /data/files)
     * so uploads survive container restarts.
     */
    uploadDir: string;
    /**
     * Public base URL the API itself is reachable at — used to construct
     * URLs returned to clients (e.g., `${baseUrl}/files/<key>`). Defaults to
     * an empty string, in which case URLs are relative paths.
     */
    baseUrl?: string;
    /**
     * Mount path for the file routes. Defaults to `/files`. The upload route
     * is `${routesPrefix}/upload`; downloads are `${routesPrefix}/<key>`.
     */
    routesPrefix?: string;
}
