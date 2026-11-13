/** `/orders/:orderId` → `/orders/{orderId}`. Already-braced segments pass through. */
export function toApiGatewayPath(path: string): string {
    return path.replace(/(^|\/):([^/]+)/g, (_match, prefix: string, name: string) => {
        return `${prefix}{${name}}`;
    });
}
