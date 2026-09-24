# Email password reset for self-hosted auth

## Problem Statement

A self-hosted Webiny project has exactly one way for a user to change their password: sign in to the
admin UI and change it. If you cannot sign in, you cannot change it.

That leaves an administrator who forgets their password with no route back in. Today the only answer
is `yarn webiny reset-password <email>`, which works but needs shell access to a machine holding the
project's JWT signing secret. That is the right tool for a locked-out operator who owns the
deployment. It is the wrong tool for an ordinary editor who forgot their password on a Friday
afternoon, because it means finding somebody with production credentials and asking them to run a
command.

Every other identity provider Webiny supports solves this for the user. A project on Cognito gets
the "forgot password" flow for free. A project on self-hosted auth does not, so moving to
self-hosted auth means giving up something users expect to exist.

## Solution

Add the flow users already recognise, using the mailer the API is already carrying.

On the admin sign-in screen, "Forgot password?" takes the user to a screen asking for their email
address. If an account exists, they receive a 6-digit code by email. They enter the code, choose a
new password, and are returned to sign-in. The three screens mirror the Cognito flow, so the
experience is the same one Webiny users already know.

When the project has no mail transport configured, the link is still present and says so plainly,
naming `yarn webiny reset-password` as the way out. Hiding the link would leave a locked-out
administrator staring at a screen that offers nothing.

The CLI escape hatch stays exactly as it is. The two flows answer different questions: the CLI
answers "nobody can get in and I own the server", and this answers "I forgot my password".

## User Stories

1. As an admin user who forgot my password, I want a "Forgot password?" link on the sign-in screen, so that I can start recovery without asking anybody for help.
2. As an admin user starting recovery, I want to enter my email address and be told a code is on its way, so that I know the request was received.
3. As an admin user, I want the reset code to arrive by email within a few seconds, so that I can finish in one sitting.
4. As an admin user, I want the email to say which project the code is for, so that I can tell two Webiny installations apart.
5. As an admin user, I want the email to state how long the code is valid, so that I know whether to hurry or request a new one.
6. As an admin user, I want to enter the code and my new password on one screen, so that the flow is as short as it can be.
7. As an admin user, I want to confirm my new password by typing it twice, so that a typo does not lock me out a second time.
8. As an admin user, I want my new password checked against the same policy the admin UI enforces, so that I am not told it is too weak only after the reset appears to succeed.
9. As an admin user who mistypes the code, I want to be told the code is wrong and be allowed to try again, so that one slip does not send me back to the start.
10. As an admin user whose code has expired, I want to be told it expired and offered a new one, so that I do not retype a dead code.
11. As an admin user, I want to request a new code if the first never arrives, so that a lost email does not end the attempt.
12. As an admin user, I want my old password to keep working until the reset completes, so that an abandoned attempt costs me nothing.
13. As an admin user, I want to be returned to the sign-in screen after a successful reset, so that I can sign in immediately.
14. As an admin user, I want to cancel at any point and go back to sign-in, so that I am never trapped in the flow.
15. As an admin user on a project with no mail configured, I want the screen to tell me mail is not set up and name the CLI command, so that I know what to ask an administrator for.
16. As a person who does not have an account, I want the same response as somebody who does, so that the screen cannot be used to discover whether an address is registered.
17. As an account holder, I want somebody who guesses my email to be unable to learn anything, so that a reset request is not a probe.
18. As an account holder, I want a code that stops working the moment it has been used once, so that an intercepted email cannot be replayed.
19. As an account holder, I want every outstanding code for my account invalidated when one is used, so that an older email in my inbox is worthless afterwards.
20. As an account holder, I want a code that expires quickly on its own, so that an old email in my inbox is not a standing key.
21. As an account holder, I want a limited number of guesses per code, so that a 6-digit code cannot be brute forced.
22. As an account holder, I want a limit on how many codes can be requested for my address, so that nobody can flood my inbox.
23. As an account holder, I want the reset to name my account from the stored code and not from what the request says, so that nobody can redirect my reset to a different account.
24. As a project administrator, I want the flow to work with whatever SMTP settings the project already has, so that I do not configure mail twice.
25. As a project administrator, I want to turn the whole flow off in config, so that a project that must not have a self-service reset does not have one.
26. As a project administrator, I want turning it off to remove the mutations from the schema entirely, so that the disabled flow is not visible in introspection.
27. As a project administrator, I want the rate limits to hold across multiple API instances, so that replicas do not multiply the allowance.
28. As a project administrator, I want reset activity visible in logs, so that I can see a spike without adding instrumentation.
29. As a project administrator, I want spent and expired codes cleaned up, so that the table does not grow without limit.
30. As a developer on another database, I want the code storage behind the same kind of seam credentials use, so that a Mongo implementation is a package, not a fork.
31. As a developer, I want the mail body behind a replaceable seam, so that I can change the wording or send through my own service without patching the package.
32. As a developer, I want the reset use cases callable outside GraphQL, so that a seeding script or a test can drive them directly.
33. As a developer, I want the admin screens decoratable like Cognito's, so that a project can restyle them without forking.
34. As a locked-out operator, I want the CLI command to keep working unchanged, so that the escape hatch is still there when mail is broken.

## Solution requirements

### Code and delivery

- A 6-digit numeric code, generated from a cryptographically secure source, delivered by email.
- A code, not a link. A link needs the admin origin known server-side, which a self-hosted
  deployment cannot be relied on to have. The code also matches what Cognito users already do.
- Codes are short-lived. 15 minutes is the starting value, long enough to survive a slow mail queue.

### What is stored

Codes are stored server side, unlike the CLI token, which is a stateless JWT. The CLI token can be
stateless because minting one requires the signing secret, which is already total authority, so
there is nothing a stored record would add. An emailed code arrives over a weaker channel, so it has
to be revocable, single-use, and countable.

Each record holds the address it was issued for, a hash of the code, when it was created, when it
expires, when it was used, and how many verification attempts it has taken. The code itself is never
stored, only the hash, produced by the same `Hasher` seam that hashes passwords. A fast hash would
let anybody with a database copy walk the whole six-digit space instantly.

### Limits

Two limits, and both matter:

- **Request limit.** A fixed number of codes per email address per window. Counted from the stored
  records, so no second store and no counter to keep in sync.
- **Attempt limit.** A fixed number of failed verifications per code, after which the code is dead
  and a new one has to be requested. Without this, six digits is 1,000,000 guesses and an afternoon.

Both counters live in the database, deliberately. Process memory does not survive multiple replicas
under `project-server` or a cold start under `project-aws`, and a limit that silently stops applying
is worse than no limit, because the code still looks protected. A shared cache like Redis would work
but would make self-service password reset depend on standing up another service, which is the wrong
trade for a self-hosted product. The database is already there and is already the thing every
instance shares.

Per-IP limiting is deliberately excluded from this PRD. See "Out of scope".

### Enumeration

The request mutation returns the same response for a known and an unknown address. Two consequences
that have to be built in from the start rather than bolted on:

- Request records are written for unknown addresses too. If records only existed for real accounts,
  the rate limit response itself would become the oracle the identical response was meant to close.
- The verification failure is undifferentiated. Wrong code, expired code, dead code, and unknown
  address all produce one error.

### When mail is not configured

The flow stays visible and fails with a message naming `yarn webiny reset-password`. This is the
case the CLI command was built for, so it is the one moment the UI should point at it. The check
happens when a code is requested, and reports the same way regardless of whether the account exists.

## Implementation Decisions

### New modules, API side

- **Reset code storage seam.** A new abstraction alongside `CredentialsStorageOperations`, not an
  addition to it. Credentials and reset codes have different lifetimes, different tables, and
  different reasons to change. The interface covers saving a code, loading the live codes for an
  address, marking one used, invalidating the rest for that address, counting recent requests for an
  address, and deleting spent and expired rows. One implementation ships in the SQL package, which
  creates its table through the same lazy `TableManager.ensure` path credentials already use, so
  there is no migration step.
- **Reset code generator.** A deep, tiny module: no input, returns a fresh 6-digit code from a
  cryptographically secure source. Its own seam so tests can pin a code and so the format can change
  in one place.
- **Reset mailer.** A seam taking an address and a code and sending the mail, with a default
  implementation over `MailerService` from `@webiny/api-mailer`. This keeps subject and body in one
  replaceable place, lets a project send through something other than SMTP, and keeps the use case
  free of templating. It is also what reports "no transport configured" upward.
- **Request reset use case.** Takes an address. Checks the request limit, records the attempt,
  resolves the credential, and on a hit generates, hashes, stores, and sends. Returns the same
  success for a miss. Surfaces exactly one distinguishable failure, which is that mail is not
  configured.
- **Reset with code use case.** Takes an address, a code, and a new password. Loads live codes for
  the address, verifies the hash, increments the attempt count on failure, and on success marks the
  code used, invalidates the rest for that address, and delegates to the existing
  `SetPasswordUseCase`, which already owns the password policy and the upsert. The account is taken
  from the stored record, never from the request.

### Modified modules, API side

- **GraphQL.** A new schema factory registering two mutations, following the shape of the CLI reset
  factory: a response type carrying `data` and the shared `SelfHostedAuthError`, resolvers declaring
  their use cases as dependencies, and the whole factory adding nothing at all when disabled.
- **Config extension.** A new optional flag on `<SelfHostedAuth />`, defaulting to on, written as a
  build param and read by the schema factory. Off removes both mutations from the schema rather than
  leaving them to refuse at runtime, matching how the CLI flag already behaves. Named as a constant
  in the shared build params module, not spelled out at each site.
- **Errors.** New error types for an invalid or spent code and for mail not being configured, in the
  existing domain errors module. The invalid-code error is deliberately undifferentiated, like the
  existing invalid-token error.

### Modified modules, admin side

- **Login screen.** The self-hosted login screen currently holds its state in `useState` inside one
  component. Adding three more screens turns that into a state machine, so the screen moves to a
  presenter reached through `useFeature`, matching the repo's rule that non-trivial component state
  lives in a presenter and following the existing Cognito presenter as prior art.
- **Three new screens**, mirroring the Cognito components one for one: request a code, code sent
  with a resend action, and set a new password. Decoratable, like Cognito's, so a project can
  restyle without forking.

### Contracts

- Both mutations are unauthenticated, like `selfHostedAuthLogin` and the CLI reset mutation.
- Request returns a success payload carrying no information about the address.
- Reset returns success, or an error whose code the UI maps to a message.
- Cleanup of spent and expired rows happens opportunistically on write, not as a scheduled task, so
  the feature stays self-contained.

## Testing Decisions

A good test here states behaviour a user or caller could observe, and would survive the internals
being rewritten. It goes through the use case or the container, not through private methods. The
existing `CliResetPasswordUseCase.test.ts` is the model: build a container, register fakes for the
seams, drive the use case, assert on the result.

Tested, in rough order of how much they matter:

- **The attempt limit.** A code dies after the configured number of wrong guesses and does not
  come back. This is the test standing between six digits and a brute force.
- **The request limit.** The configured number of requests per address per window is allowed, the
  next is refused, and the window is counted from stored records rather than from process state.
- **Single use.** A code that has been used does not work twice, and using one invalidates the other
  outstanding codes for the same address.
- **Expiry.** A code past its expiry is refused, and refused identically to a wrong code.
- **Enumeration.** A request for an unknown address returns exactly what a known address returns,
  including once the limit has been hit. Asserted at the resolver, since that is the boundary an
  attacker sees.
- **Account binding.** The password is set for the account named by the stored record, not by the
  request, in the same spirit as the existing test that the CLI use case takes the user id from the
  stored credential.
- **Mail not configured.** The request reports the configured-mail failure, and the message names
  the CLI command.
- **The schema flag.** Both mutations are absent when the flag is off and present when it is on or
  unset, following `cliResetPasswordSchema.test.ts`, including the stringified `false` case that
  build params can produce.
- **The code generator.** Always six digits, zero-padded, drawn across the whole range.
- **The SQL storage operations.** Round-trip, counting within a window, and marking used, against
  sqlite through `WEBINY_STORAGE=sql`. The SQL package has no test suite today, so this adds the
  first one.

The admin screens are not unit tested, matching how the Cognito screens are handled today. The
presenter is, since the state machine is where the behaviour lives.

## Out of Scope

- **Per-IP rate limiting.** Per-address limiting is in. Per-IP needs its own keyed rows and, more
  importantly, a decision about trusted proxy headers, because behind a reverse proxy the remote
  address is the proxy's. A per-IP limit reading the wrong address either throttles everybody at
  once or nobody at all. Worth doing, worth doing separately, once the trusted-proxy story is
  settled.
- **Reset links.** Codes only, for the reasons above.
- **Changing the CLI flow.** `yarn webiny reset-password` stays as it is.
- **Password policy changes.** The new flow uses the policy `SetPasswordUseCase` already enforces.
- **Account lockout.** Limiting reset attempts is in scope. Locking an account after failed sign-ins
  is a different feature.
- **Mail templating, branding, and localisation.** One plain body behind a replaceable seam. A
  project that wants more replaces the seam.
- **Notifying a user that their password changed.** Worth having, not needed to close this gap.
- **A Mongo implementation of the storage seam.** The seam is defined so it can be added; only SQL
  ships here, matching the credentials seam today.

## Further Notes

The reason codes are stored while the CLI token is not is worth keeping in mind during review,
because the two look similar and are not. The CLI token is bearer authority derived from the signing
secret, which already permits minting a login token for any user, so a stored record would add
nothing. An emailed code is the first thing in this package that grants access to somebody who holds
no secret at all, which is why it needs single use, expiry, and both limits.

Everything this needs on the mail side already exists. `@webiny/api-mailer` ships an SMTP transport
and settings, and `MailerFeature` is registered in the API request stack, so no new wiring is needed
to send a message.
