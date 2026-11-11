/**
 * Sent to the user's open admin tabs when a team is created. The admin keeps its own teams list, and a
 * team created on the server (by the assistant's `createTeam` tool, for one) never passes through it,
 * so without this the Teams view shows the old list until a reload. Carries the team id only; the
 * admin reads the team back.
 */
export const TEAM_CREATED_WEBSOCKET_ACTION = "security.team.created";
