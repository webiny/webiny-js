/**
 * One registered notification transport, as the transports operation lists it (D129, R191).
 * `description` is `null` when the transport has none.
 */
export interface NotificationTransportInfo {
    id: string;
    title: string;
    description: string | null;
}
