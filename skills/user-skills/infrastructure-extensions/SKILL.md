---
name: webiny-infrastructure-extensions
context: webiny-extensions
description: >
  Modifying AWS infrastructure using Pulumi handlers and declarative Infra components.
  Use this skill when the developer wants to customize AWS infrastructure, add Pulumi handlers,
  configure OpenSearch, VPC, resource tags, regions, custom domains, blue-green deployments,
  environment-conditional config, or manage production vs development infrastructure modes.
  Covers CorePulumi.Interface, all <Infra.*> declarative components, and <Infra.Env.Is>.
---

# Infrastructure Extensions

## TL;DR

Infrastructure extensions modify your AWS infrastructure using Pulumi handlers and declarative `<Infra.*>` components in `webiny.config.tsx`. Pulumi handlers implement `CorePulumi.Interface` and are registered via `<Infra.Core.Pulumi>`. Declarative components configure OpenSearch, VPC, tags, regions, custom domains, blue-green deployments, and environment-specific settings.

## Pulumi Handler Pattern

Write custom Pulumi code that runs during infrastructure deployment:

```typescript
// extensions/MyCorePulumiHandler.ts
import { Ui } from "webiny/infra";
import { CorePulumi } from "webiny/infra/core";

class MyCorePulumiHandlerImpl implements CorePulumi.Interface {
  constructor(private ui: Ui.Interface) {}

  execute(app: any) {
    this.ui.info("Executing MyCorePulumiHandler with environment:", app.env);

    // Access and modify Pulumi resources here
    // app.resources gives you access to all provisioned resources
  }
}

export default CorePulumi.createImplementation({
  implementation: MyCorePulumiHandlerImpl,
  dependencies: [Ui]
});
```

Register (**YOU MUST include the `.ts` file extension in the `src` prop** — omitting it will cause a build failure):

```tsx
<Infra.Core.Pulumi src={"/extensions/MyCorePulumiHandler.ts"} />
```

### Use Cases for Pulumi Handlers

- Add custom AWS resources (CloudWatch alarms, extra S3 buckets, Lambda functions)
- Modify existing resource properties (Lambda memory, timeouts, environment variables)
- Add conditional infrastructure based on environment
- Integrate with third-party infrastructure providers

## Declarative Infrastructure Components

These components go directly in `webiny.config.tsx` -- no separate extension file needed:

### AWS Configuration

```tsx
{/* Set the AWS region */}
<Infra.Aws.DefaultRegion name={"us-east-1"} />

{/* Apply tags to all AWS resources -- multiple calls are merged */}
<Infra.Aws.Tags tags={{ OWNER: "me", PROJECT: "my-project" }} />
<Infra.Aws.Tags tags={{ COST_CENTER: "engineering" }} />
```

### Search & Networking

```tsx
{
  /* Enable/disable OpenSearch */
}
<Infra.OpenSearch enabled={true} />;

{
  /* Enable/disable VPC deployment */
}
<Infra.Vpc enabled={false} />;
```

### Resource Naming

```tsx
{
  /* Prefix all Pulumi resource names */
}
<Infra.PulumiResourceNamePrefix prefix={"myproj-"} />;

{
  /* Define which environments use production-grade infrastructure */
}
<Infra.ProductionEnvironments environments={["prod", "staging"]} />;
```

### Custom Domains

```tsx
<Infra.Admin.CustomDomains
  domains={["admin.example.com"]}
  sslMethod="sni-only"
  certificateArn="arn:aws:acm:us-east-1:123456789:certificate/abc-123"
/>
```

### Blue-Green Deployments

```tsx
<Infra.BlueGreenDeployments
  enabled={true}
  domains={{
    acmCertificateArn: "arn:aws:acm:us-east-1:123456789:certificate/abc-123",
    sslSupportMethod: "sni-only",
    domains: {
      api: ["api.example.com"],
      admin: ["admin.example.com"],
      website: ["website.example.com"],
      preview: ["preview.example.com"]
    }
  }}
  deployments={[
    { name: "green", env: "dev", variant: "green" },
    { name: "blue", env: "dev", variant: "blue" }
  ]}
/>
```

## Environment-Conditional Configuration

Use `<Infra.Env.Is>` to apply settings only in specific environments:

```tsx
{
  /* Production only */
}
<Infra.Env.Is env="prod">
  <Infra.Aws.Tags tags={{ ENV: "production" }} />
  <Infra.OpenSearch enabled={true} />
</Infra.Env.Is>;

{
  /* Non-production (accepts array) */
}
<Infra.Env.Is env={["dev", "staging"]}>
  <Infra.Aws.Tags tags={{ ENV: "non-production" }} />
  <Infra.OpenSearch enabled={false} />
</Infra.Env.Is>;
```

## Project-Level Settings

```tsx
{
  /* Disable telemetry */
}
<Project.Telemetry enabled={false} />;

{
  /* Auto-install for CI/CD (skip the installation wizard) */
}
{
  process.env.WEBINY_CLI_AUTO_INSTALL && (
    <Project.AutoInstall
      adminUser={{
        firstName: "Ad",
        lastName: "Min",
        email: "admin@webiny.com",
        password: "12345678"
      }}
    />
  );
}
```

## All Infrastructure Components Reference

| Component                                               | Purpose                              |
| ------------------------------------------------------- | ------------------------------------ |
| `<Infra.Aws.DefaultRegion name="..." />`                | Set the AWS region                   |
| `<Infra.Aws.Tags tags={{ ... }} />`                     | Tag all AWS resources                |
| `<Infra.OpenSearch enabled={bool} />`                   | Enable/disable OpenSearch cluster    |
| `<Infra.Vpc enabled={bool} />`                          | Enable/disable VPC deployment        |
| `<Infra.PulumiResourceNamePrefix prefix="..." />`       | Prefix Pulumi resource names         |
| `<Infra.ProductionEnvironments environments={[...]} />` | Define production-grade environments |
| `<Infra.Admin.CustomDomains ... />`                     | Custom domains for Admin app         |
| `<Infra.BlueGreenDeployments ... />`                    | Blue-green deployment configuration  |
| `<Infra.Env.Is env="..." />`                            | Conditional config per environment   |
| `<Infra.Core.Pulumi src="..." />`                       | Register a custom Pulumi handler     |
| `<Project.Telemetry enabled={bool} />`                  | Enable/disable telemetry             |
| `<Project.AutoInstall adminUser={{ ... }} />`           | Auto-install for CI/CD               |

## Quick Reference

```
Pulumi import:   import { CorePulumi } from "webiny/infra/core";
Ui import:       import { Ui } from "webiny/infra";
Interface:       CorePulumi.Interface
Export:          CorePulumi.createImplementation({ implementation, dependencies })
Register:        <Infra.Core.Pulumi src={"/extensions/MyHandler.ts"} />
Deploy:          yarn webiny deploy core  (infrastructure changes)
```

## Related Skills

- `webiny-project-structure` -- Full `webiny.config.tsx` anatomy
- `webiny-local-development` -- Deployment commands and environment management
- `webiny-full-stack-architect` -- Full-stack extensions that may require custom infrastructure
