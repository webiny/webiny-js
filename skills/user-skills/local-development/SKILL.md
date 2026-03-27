---
name: webiny-local-development
context: webiny-extensions
description: >
  Deploying, developing locally, managing environments, and debugging Webiny projects.
  Use this skill when the developer asks about deployment commands (deploy, destroy, info),
  local development with watch mode (API or Admin), the Local Lambda Development system,
  environment management (long-lived vs short-lived, production vs dev modes), build parameters,
  state files, debugging API/Admin/Infrastructure errors, or the redeploy-after-watch requirement.
---

# Local Development and Deployment

## TL;DR

Webiny is a serverless platform on AWS. Deploy with `yarn webiny deploy`, develop locally with `yarn webiny watch` (API uses Local Lambda Development, Admin runs a local React dev server). Projects support multiple environments (long-lived and short-lived). Always redeploy after stopping watch mode.

## Deployment

### Initial Deployment

Deploy all three applications (Core, API, Admin) at once:

```bash
yarn webiny deploy
```

This deploys to the `dev` environment by default. First deployment takes 5-15 minutes.

### Deploying Individual Applications

```bash
yarn webiny deploy core        # Infrastructure only
yarn webiny deploy api         # Backend API only
yarn webiny deploy admin       # Admin frontend only
```

### Deploy to a Specific Environment

```bash
yarn webiny deploy --env prod
yarn webiny deploy api --env staging
```

### Get Deployment Info

```bash
yarn webiny info              # Shows all URLs (Admin, API, CloudFront)
yarn webiny info --env prod   # Info for a specific environment
```

## Local Development

Before developing locally, you must deploy Core and API first:

```bash
yarn webiny deploy core api
```

### Admin Development

```bash
yarn webiny watch admin
```

- Starts a local dev server at `http://localhost:3001`
- Hot module replacement for instant feedback
- Standard React development experience
- Use for: custom Admin UI extensions, white-label branding, custom views

### API Development (Local Lambda Development)

```bash
yarn webiny watch api
```

How it works:

1. **Lambda stubs deployed** -- real Lambda functions are replaced with stubs that forward events
2. **Events forwarded** -- requests to AWS get forwarded to your local machine
3. **Local execution** -- your code runs locally with full AWS Lambda environment
4. **Response routing** -- responses sent back through the Lambda stub

Benefits:

- See backend code changes instantly (no redeployment)
- Debug locally with standard Node.js tools
- Console logs appear directly in your terminal

**IMPORTANT: Redeploy After Watch**

When you stop `yarn webiny watch api`, your Lambda functions still contain stub code. You **must** redeploy:

```bash
yarn webiny deploy api
```

The watch command prints a reminder when you stop it.

### Running Both

You can run both watch commands simultaneously in separate terminals:

```bash
# Terminal 1
yarn webiny watch api

# Terminal 2
yarn webiny watch admin
```

## Environments

### Long-Lived Environments

Persistent environments maintained over time:

- **dev** -- daily development
- **staging** -- pre-production testing
- **prod** -- production

Best practice: manage via CI/CD pipelines.

### Short-Lived Environments

Temporary environments for specific purposes:

- Feature branch testing
- PR previews
- Experimentation

```bash
# Create a short-lived environment
yarn webiny deploy --env feature-123

# Destroy when done
yarn webiny destroy --env feature-123
```

### Deployment Modes

Webiny has two deployment templates:

- **dev** -- smaller, cheaper infrastructure for development
- **prod** -- production-grade infrastructure with HA, backups, auto-scaling

The mode is determined by whether the environment name is in the `ProductionEnvironments` list:

```tsx
// webiny.config.tsx
<Infra.ProductionEnvironments environments={["prod", "staging"]} />
```

## State Files

State files are JSON files that track the current state of your deployment:

- Store infrastructure resource info, configurations, and metadata
- Essential for managing environments and tracking changes
- Stored in S3 by default

## Debugging

### API Errors

During `yarn webiny watch api`:

- **Console logs** appear directly in the terminal
- Use `console.log()` for quick debugging
- Use `Logger` (DI-injected) for production logging to CloudWatch

```typescript
import { Logger } from "webiny/api/logger";

// In your extension class
this.logger.info("Processing request...");
this.logger.warn("Something unexpected");
this.logger.error("Something failed");
```

### Admin Errors

Use browser DevTools:

- **Console** -- view logs and errors
- **Network tab** -- inspect GraphQL requests/responses
- **React Developer Tools** -- debug component state/props
- **GraphQL Network Inspector** -- inspect GraphQL operations

### Infrastructure Errors

Deployment errors from Pulumi typically relate to:

- IAM permission issues
- AWS service quotas
- Resource configuration problems

Check the deployment output for specific error messages.

## CLI Commands Reference

| Command                                 | Purpose                            |
| --------------------------------------- | ---------------------------------- |
| `yarn webiny deploy`                    | Deploy all applications            |
| `yarn webiny deploy [core\|api\|admin]` | Deploy specific application        |
| `yarn webiny deploy --env <name>`       | Deploy to specific environment     |
| `yarn webiny destroy --env <name>`      | Destroy an environment             |
| `yarn webiny watch api`                 | Start local API development        |
| `yarn webiny watch admin`               | Start local Admin development      |
| `yarn webiny info`                      | Show deployment info and URLs      |
| `yarn webiny info --env <name>`         | Show info for specific environment |
| `yarn webiny extension <name>`          | Install a pre-built extension      |

## Quick Reference

```
First deploy:     yarn webiny deploy
Dev API:          yarn webiny watch api
Dev Admin:        yarn webiny watch admin
Get URLs:         yarn webiny info
Deploy env:       yarn webiny deploy --env staging
After watch:      yarn webiny deploy api  (MUST redeploy!)
```

## Related Skills

- `webiny-project-structure` -- Project layout and `webiny.config.tsx`
- `webiny-infrastructure-extensions` -- Customizing AWS infrastructure and environments
