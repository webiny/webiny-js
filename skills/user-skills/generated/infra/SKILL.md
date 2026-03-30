---
name: webiny-infra-catalog
context: webiny-api
description: >
  Infrastructure — 33 abstractions.
  Infrastructure extensions.
---

# Infrastructure

Infrastructure extensions.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `AdminAfterBuild`
**Import:** `import { AdminAfterBuild } from "webiny/infra/admin"`
**Source:** `@webiny/project/abstractions/features/hooks/AdminAfterBuild.ts`

---

**Name:** `AdminAfterDeploy`
**Import:** `import { AdminAfterDeploy } from "webiny/infra/admin"`
**Source:** `@webiny/project/abstractions/features/hooks/AdminAfterDeploy.ts`

---

**Name:** `AdminBeforeBuild`
**Import:** `import { AdminBeforeBuild } from "webiny/infra/admin"`
**Source:** `@webiny/project/abstractions/features/hooks/AdminBeforeBuild.ts`

---

**Name:** `AdminBeforeDeploy`
**Import:** `import { AdminBeforeDeploy } from "webiny/infra/admin"`
**Source:** `@webiny/project/abstractions/features/hooks/AdminBeforeDeploy.ts`

---

**Name:** `AdminBeforeWatch`
**Import:** `import { AdminBeforeWatch } from "webiny/infra/admin"`
**Source:** `@webiny/project/abstractions/features/hooks/AdminBeforeWatch.ts`

---

**Name:** `AdminPulumi`
**Import:** `import { AdminPulumi } from "webiny/infra/admin"`
**Source:** `@webiny/project/abstractions/features/pulumi/AdminPulumi.ts`
**Description:** Implement this abstraction to add custom Pulumi code to Admin.

---

**Name:** `AdminStackOutputService`
**Import:** `import { AdminStackOutputService } from "webiny/infra/admin"`
**Source:** `@webiny/project-aws/abstractions/services/AdminStackOutputService.ts`

---

**Name:** `AdminStackOutputService`
**Import:** `import { AdminStackOutputService } from "webiny/infra"`
**Source:** `@webiny/project-aws/abstractions/index.ts`

---

**Name:** `AfterBuild`
**Import:** `import { AfterBuild } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/features/hooks/AfterBuild.ts`

---

**Name:** `AfterDeploy`
**Import:** `import { AfterDeploy } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/features/hooks/AfterDeploy.ts`

---

**Name:** `ApiAfterBuild`
**Import:** `import { ApiAfterBuild } from "webiny/infra/api"`
**Source:** `@webiny/project/abstractions/features/hooks/ApiAfterBuild.ts`

---

**Name:** `ApiAfterDeploy`
**Import:** `import { ApiAfterDeploy } from "webiny/infra/api"`
**Source:** `@webiny/project/abstractions/features/hooks/ApiAfterDeploy.ts`

---

**Name:** `ApiBeforeBuild`
**Import:** `import { ApiBeforeBuild } from "webiny/infra/api"`
**Source:** `@webiny/project/abstractions/features/hooks/ApiBeforeBuild.ts`

---

**Name:** `ApiBeforeDeploy`
**Import:** `import { ApiBeforeDeploy } from "webiny/infra/api"`
**Source:** `@webiny/project/abstractions/features/hooks/ApiBeforeDeploy.ts`

---

**Name:** `ApiBeforeWatch`
**Import:** `import { ApiBeforeWatch } from "webiny/infra/api"`
**Source:** `@webiny/project/abstractions/features/hooks/ApiBeforeWatch.ts`

---

**Name:** `ApiGqlClient`
**Import:** `import { ApiGqlClient } from "webiny/infra"`
**Source:** `@webiny/project-aws/abstractions/index.ts`

---

**Name:** `ApiPulumi`
**Import:** `import { ApiPulumi } from "webiny/infra/api"`
**Source:** `@webiny/project/abstractions/features/pulumi/ApiPulumi.ts`
**Description:** Implement this abstraction to add custom Pulumi code to API.

---

**Name:** `ApiStackOutputService`
**Import:** `import { ApiStackOutputService } from "webiny/infra/api"`
**Source:** `@webiny/project-aws/abstractions/services/ApiStackOutputService.ts`

---

**Name:** `ApiStackOutputService`
**Import:** `import { ApiStackOutputService } from "webiny/infra"`
**Source:** `@webiny/project-aws/abstractions/index.ts`

---

**Name:** `BeforeBuild`
**Import:** `import { BeforeBuild } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/features/hooks/BeforeBuild.ts`

---

**Name:** `BeforeDeploy`
**Import:** `import { BeforeDeploy } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/features/hooks/BeforeDeploy.ts`

---

**Name:** `BeforeWatch`
**Import:** `import { BeforeWatch } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/features/hooks/BeforeWatch.ts`

---

**Name:** `CoreAfterBuild`
**Import:** `import { CoreAfterBuild } from "webiny/infra/core"`
**Source:** `@webiny/project/abstractions/features/hooks/CoreAfterBuild.ts`

---

**Name:** `CoreAfterDeploy`
**Import:** `import { CoreAfterDeploy } from "webiny/infra/core"`
**Source:** `@webiny/project/abstractions/features/hooks/CoreAfterDeploy.ts`

---

**Name:** `CoreBeforeBuild`
**Import:** `import { CoreBeforeBuild } from "webiny/infra/core"`
**Source:** `@webiny/project/abstractions/features/hooks/CoreBeforeBuild.ts`

---

**Name:** `CoreBeforeDeploy`
**Import:** `import { CoreBeforeDeploy } from "webiny/infra/core"`
**Source:** `@webiny/project/abstractions/features/hooks/CoreBeforeDeploy.ts`

---

**Name:** `CorePulumi`
**Import:** `import { CorePulumi } from "webiny/infra/core"`
**Source:** `@webiny/project/abstractions/features/pulumi/CorePulumi.ts`
**Description:** Implement this abstraction to add custom Pulumi code to Core.

---

**Name:** `CoreStackOutputService`
**Import:** `import { CoreStackOutputService } from "webiny/infra/core"`
**Source:** `@webiny/project-aws/abstractions/services/CoreStackOutputService.ts`

---

**Name:** `CoreStackOutputService`
**Import:** `import { CoreStackOutputService } from "webiny/infra"`
**Source:** `@webiny/project-aws/abstractions/index.ts`

---

**Name:** `EnvVar`
**Import:** `import { EnvVar } from "webiny/infra"`
**Source:** `@webiny/project/extensions/EnvVar.ts`
**Description:** Define an environment variable in the project context.

---

**Name:** `InvokeLambdaFunction`
**Import:** `import { InvokeLambdaFunction } from "webiny/infra"`
**Source:** `@webiny/project-aws/abstractions/index.ts`

---

**Name:** `LoggerService`
**Import:** `import { LoggerService } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/services/LoggerService.ts`

---

**Name:** `UiService`
**Import:** `import { UiService } from "webiny/infra"`
**Source:** `@webiny/project/abstractions/services/UiService.ts`

---
