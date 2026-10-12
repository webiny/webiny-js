# "Who did this?" has no answer on the instance: three trails are missing

> **Area:** the dev instance's operations, not the migration code.
> **Severity:** medium now, high once a team shares the instance. A site was republished by someone
> unknown on 2026-10-12, and the question could not be answered.
> **Status:** open. Found 2026-10-12.

## What happened

Take 3's site was published again at 08:28:24 UTC. The background task records only that it was created
by the "Webiny Admin" login as an admin user, which means through the admin UI. That ruled out the API
token (shown as "Universal API Key") and the session doing the work, but nothing narrower could be
found. The login is a shared default, so anyone holding it can publish any site, the demo fallback
included.

## The three trails that are missing

1. **The audit log is empty.** `auditLogs.listAuditLogs` returns no entries at all, so a publish, an
   approval or a delete leaves nothing in it.
2. **The GraphQL Lambda logs carry no caller.** They hold platform start and report lines with durations,
   and no request headers, source address, user agent or operation name. The publish request is visible
   only as a 2.9-second request at about 08:28:24.
3. **CloudFront access logging is off.** The only CloudFront log group is Lambda@Edge's, so the
   distribution in front of the API records no viewer address or time.

## Before the handover

- **Change the shared admin password.** Sven does this himself before the handover. Scripts that use the
  API token are unaffected; browser checks need the new password.
- **Decide which trail to turn on.** Any one of these would have answered 08:28:
  - the audit log, with publishes and approvals recorded;
  - request logging with the caller's identity and operation name;
  - CloudFront access logs.
- **Use a login per person** when Veronica's team starts, so a task's creator names someone.
