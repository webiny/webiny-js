/*
 * The WebSocket close codes the server sends, from the IANA registry. Kept in one place so the
 * admin's reconnect behaviour can be checked against a single list.
 */

// The connection went stale and the server evicted it. The client reconnects.
export const GOING_AWAY = 1001;

/*
 * The server is stopping. The client reconnects at once, and behind a load balancer it reaches a
 * process that is still up.
 */
export const SERVICE_RESTART = 1012;
