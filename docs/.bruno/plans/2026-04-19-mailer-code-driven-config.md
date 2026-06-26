# Code-Driven Mailer Configuration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `<Infra.Mailer.Smtp host port user password from replyTo />` so mailer settings can be declared in `webiny.config.tsx` and take precedence over the KV store at runtime. Admin UI becomes read-only when settings are code-defined; `saveSettings` mutation rejects with `SettingsLockedByCode`. The GraphQL response always masks the password.

**Architecture:** Component → BuildParam (`Mailer.SmtpSettings`) → new `CodeMailerSettings` abstraction in `api-mailer` → `GetSettingsRepository.get(transportName)` checks code source first, falls back to KV. A new `ActiveTransport` helper centralizes the existing "last-registered-factory-wins" selection logic so both `MailerService.sendMail` and `SaveSettingsUseCase` can use it. `IMailTransportFactory` gains a `name: string` property so we can identify the active transport without constructing one.

**Tech Stack:** TypeScript, Vitest, `@webiny/feature/api` DI, `@webiny/api-core/features/buildParams`, Webiny project-extension framework (`defineExtension` / `<BuildParam>` emission), `@apollo/react-components` admin UI.

**Commit policy:** Commits are authorized by the user for this session. Each task ends with a commit using the suggested message. Commits should only be made when the task's tests pass and build is green.

**Branch:** `bruno/feat/api-mailer/code-config`, branched from `bruno/refactor/api-mailer/encryption` tip.

**Before every task:** `yarn > /dev/null 2>&1` once if lockfile is cold.

---

## File map

**New files**
- `packages/project-aws/src/extensions/Mailer/Smtp.tsx`
- `packages/api-mailer/src/domain/CodeMailerSettings/abstractions.ts`
- `packages/api-mailer/src/features/CodeMailerSettings/CodeMailerSettingsImpl.ts`
- `packages/api-mailer/src/features/CodeMailerSettings/feature.ts`
- `packages/api-mailer/src/features/MailerService/ActiveTransport.ts`
- `packages/api-mailer/__tests__/helpers/registerCodeSmtpSettings.ts`
- `packages/api-mailer/__tests__/activeTransport.test.ts`
- `packages/api-mailer/__tests__/codeSettings.test.ts`
- `packages/api-mailer/__tests__/settings.codeSource.test.ts`

**Modified files**
- `packages/project-aws/src/extensions/index.ts` (+export `Smtp` as `MailerSmtp`)
- `packages/project-aws/src/extensions/definitions.ts` (+`Smtp.def`)
- `packages/project-aws/src/infra.ts` (+`Mailer.Smtp` namespace)
- `packages/api-mailer/src/domain/MailTransport/abstractions.ts` (+`name` on `IMailTransportFactory`, +`IActiveTransport`/`ActiveTransport` abstraction)
- `packages/api-mailer/src/domain/errors.ts` (+`SettingsLockedByCode`)
- `packages/api-mailer/src/features/SmtpTransport/SmtpMailTransportFactory.ts` (+`name`)
- `packages/api-mailer/src/features/DummyTransport/DummyMailTransportFactory.ts` (+`name`)
- `packages/api-mailer/src/features/MailerService/feature.ts` (+register `ActiveTransport`)
- `packages/api-mailer/src/features/MailerService/MailerService.ts` (use `ActiveTransport`, pass `transportName`)
- `packages/api-mailer/src/features/GetSettings/abstractions.ts` (new return shape + `transportName` arg)
- `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts` (inject `CodeMailerSettings`, signature change, source in return)
- `packages/api-mailer/src/features/GetSettings/GetSettingsUseCase.ts` (propagate `transportName` + source)
- `packages/api-mailer/src/features/SaveSettings/abstractions.ts` (+`SettingsLockedByCode` in error union)
- `packages/api-mailer/src/features/SaveSettings/SaveSettingsUseCase.ts` (+locked check)
- `packages/api-mailer/src/index.ts` (register `CodeMailerSettingsFeature`)
- `packages/api-mailer/src/graphql/settings.ts` (+`source` field, mask password, active transport name)
- `packages/api-mailer/__tests__/settings.crud.test.ts` (update masking + source assertions)
- `packages/api-mailer/__tests__/settings.graphql.test.ts` (update masking + source assertions)
- `packages/app-mailer/src/views/settings/graphql.ts` (+`source`, +`password` in selection)
- `packages/app-mailer/src/views/settings/Settings.tsx` (read-only branch + banner)

---

## Task 1: Add `name` to `IMailTransportFactory` and both factory implementations

**Why first:** Every subsequent task that needs to identify the active transport depends on this. Self-contained — doesn't yet change behavior because nothing reads `name` yet.

**Files:**
- Modify: `packages/api-mailer/src/domain/MailTransport/abstractions.ts`
- Modify: `packages/api-mailer/src/features/SmtpTransport/SmtpMailTransportFactory.ts`
- Modify: `packages/api-mailer/src/features/DummyTransport/DummyMailTransportFactory.ts`

### Steps

- [ ] **Step 1: Extend the `IMailTransportFactory` abstraction**

Edit `packages/api-mailer/src/domain/MailTransport/abstractions.ts`. The file currently reads:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse, TransportSettings } from "~/types.js";

export interface IMailTransport {
    name: string;
    send(params: TransportSendData): Promise<TransportSendResponse>;
}

export const MailTransport = createAbstraction<IMailTransport>("MailTransport");

export namespace MailTransport {
    export type Interface = IMailTransport;
    export type SendParams = TransportSendData;
}

export interface IMailTransportFactory {
    createTransport(settings: TransportSettings): Promise<IMailTransport>;
}

export const MailTransportFactory =
    createAbstraction<IMailTransportFactory>("MailTransportFactory");

export namespace MailTransportFactory {
    export type Interface = IMailTransportFactory;
    export type Return = Promise<IMailTransport>;
}
```

Add a `name: string` member to `IMailTransportFactory`. The final file must read exactly:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse, TransportSettings } from "~/types.js";

export interface IMailTransport {
    name: string;
    send(params: TransportSendData): Promise<TransportSendResponse>;
}

export const MailTransport = createAbstraction<IMailTransport>("MailTransport");

export namespace MailTransport {
    export type Interface = IMailTransport;
    export type SendParams = TransportSendData;
}

export interface IMailTransportFactory {
    name: string;
    createTransport(settings: TransportSettings): Promise<IMailTransport>;
}

export const MailTransportFactory =
    createAbstraction<IMailTransportFactory>("MailTransportFactory");

export namespace MailTransportFactory {
    export type Interface = IMailTransportFactory;
    export type Return = Promise<IMailTransport>;
}
```

(Do NOT add `ActiveTransport` yet — that happens in Task 2.)

- [ ] **Step 2: Implement `name` on `SmtpMailTransportFactory`**

Edit `packages/api-mailer/src/features/SmtpTransport/SmtpMailTransportFactory.ts`. Full final file:

```ts
import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import type { TransportSettings } from "~/types.js";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import { SmtpConfig } from "~/features/SmtpTransport/SmtpConfig.js";

class SmtpMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = "Mailer/SmtpTransport";

    async createTransport(settings: TransportSettings): MailTransportFactory.Return {
        return new SmtpMailTransport(SmtpConfig.fromTransportSettings(settings));
    }
}

export const SmtpMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: SmtpMailTransportFactoryImpl,
    dependencies: []
});
```

- [ ] **Step 3: Implement `name` on `DummyMailTransportFactory`**

Edit `packages/api-mailer/src/features/DummyTransport/DummyMailTransportFactory.ts`. Full final file:

```ts
import { type IMailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { DummyMailTransport } from "./DummyMailTransport.js";

class DummyMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = "Mailer/DummyTransport";

    async createTransport(): Promise<IMailTransport> {
        return new DummyMailTransport();
    }
}

export const DummyMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: DummyMailTransportFactoryImpl,
    dependencies: []
});
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds. TypeScript should be satisfied because every implementation of `IMailTransportFactory` now exposes `name`.

- [ ] **Step 5: Full test suite (regression check)**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: 14/14 passing. No test references `name` on the factory yet — this is purely additive.

- [ ] **Step 6: Commit**

```bash
git add packages/api-mailer/src/domain/MailTransport/abstractions.ts \
        packages/api-mailer/src/features/SmtpTransport/SmtpMailTransportFactory.ts \
        packages/api-mailer/src/features/DummyTransport/DummyMailTransportFactory.ts
git commit -m "$(cat <<'EOF'
refactor(api-mailer): add name property to IMailTransportFactory

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add `ActiveTransport` abstraction + implementation + unit test

**Why second:** Extracts the "last-registered-factory-wins" logic into a single place so Tasks 4 and 5 can both depend on it without duplication.

**Files:**
- Modify: `packages/api-mailer/src/domain/MailTransport/abstractions.ts` (add abstraction)
- Create: `packages/api-mailer/src/features/MailerService/ActiveTransport.ts`
- Modify: `packages/api-mailer/src/features/MailerService/feature.ts` (register)
- Create: `packages/api-mailer/__tests__/activeTransport.test.ts`

### Steps

- [ ] **Step 1: Write the failing test**

Create `packages/api-mailer/__tests__/activeTransport.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createContextHandler } from "./contextHandler";
import { ActiveTransport } from "~/domain/MailTransport/abstractions.js";

describe("ActiveTransport", () => {
    const { handle } = createContextHandler();

    it("returns the name of the last-registered transport factory", async () => {
        const context = await handle();
        const active = context.container.resolve(ActiveTransport);

        // DummyTransportFeature is registered before SmtpTransportFeature in
        // createMailerContext, so SmtpTransport is the last one — it wins.
        expect(active.name()).toBe("Mailer/SmtpTransport");
    });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
yarn test packages/api-mailer --run __tests__/activeTransport.test.ts 2>&1 | tail -20
```

Expected: import error — `ActiveTransport` does not exist on the abstraction module yet.

- [ ] **Step 3: Add the `ActiveTransport` abstraction**

Edit `packages/api-mailer/src/domain/MailTransport/abstractions.ts`. Append the following at the end of the file, AFTER the existing `MailTransportFactory` namespace block:

```ts
export interface IActiveTransport {
    name(): string | null;
}

export const ActiveTransport = createAbstraction<IActiveTransport>("ActiveTransport");

export namespace ActiveTransport {
    export type Interface = IActiveTransport;
}
```

- [ ] **Step 4: Implement `ActiveTransport`**

Create `packages/api-mailer/src/features/MailerService/ActiveTransport.ts`:

```ts
import {
    ActiveTransport as ActiveTransportAbstraction,
    MailTransportFactory
} from "~/domain/MailTransport/abstractions.js";

class ActiveTransportImpl implements ActiveTransportAbstraction.Interface {
    constructor(private transportFactories: MailTransportFactory.Interface[]) {}

    name(): string | null {
        if (this.transportFactories.length === 0) {
            return null;
        }
        return this.transportFactories[this.transportFactories.length - 1].name;
    }
}

export const ActiveTransport = ActiveTransportAbstraction.createImplementation({
    implementation: ActiveTransportImpl,
    dependencies: [[MailTransportFactory, { multiple: true }]]
});
```

- [ ] **Step 5: Register `ActiveTransport` in the mailer service feature**

Edit `packages/api-mailer/src/features/MailerService/feature.ts`. Full final file:

```ts
import { createFeature } from "@webiny/feature/api";
import { MailerService } from "./MailerService.js";
import { ActiveTransport } from "./ActiveTransport.js";

export const MailerServiceFeature = createFeature({
    name: "Mailer/MailerService",
    register(container) {
        container.register(ActiveTransport).inSingletonScope();
        container.register(MailerService).inSingletonScope();
    }
});
```

- [ ] **Step 6: Run the test again**

```bash
yarn test packages/api-mailer --run __tests__/activeTransport.test.ts 2>&1 | tail -20
```

Expected: 1 passed.

- [ ] **Step 7: Full suite (regression check)**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: 15 tests passing now (14 old + 1 new).

- [ ] **Step 8: Commit**

```bash
git add packages/api-mailer/src/domain/MailTransport/abstractions.ts \
        packages/api-mailer/src/features/MailerService/ActiveTransport.ts \
        packages/api-mailer/src/features/MailerService/feature.ts \
        packages/api-mailer/__tests__/activeTransport.test.ts
git commit -m "$(cat <<'EOF'
feat(api-mailer): add ActiveTransport abstraction for transport resolution

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add `CodeMailerSettings` abstraction + implementation + feature + test

**Why third:** Introduces the code-settings lookup in isolation, with a unit test that proves the BuildParam wiring. Nothing else consumes it yet — that happens in Task 4.

**Files:**
- Create: `packages/api-mailer/src/domain/CodeMailerSettings/abstractions.ts`
- Create: `packages/api-mailer/src/features/CodeMailerSettings/CodeMailerSettingsImpl.ts`
- Create: `packages/api-mailer/src/features/CodeMailerSettings/feature.ts`
- Modify: `packages/api-mailer/src/index.ts` (register the feature)
- Create: `packages/api-mailer/__tests__/helpers/registerCodeSmtpSettings.ts`
- Create: `packages/api-mailer/__tests__/codeSettings.test.ts`

### Steps

- [ ] **Step 1: Create the abstraction**

Create `packages/api-mailer/src/domain/CodeMailerSettings/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { TransportSettings } from "~/types.js";

export interface ICodeMailerSettings {
    get(transportName: string): TransportSettings | null;
}

export const CodeMailerSettings = createAbstraction<ICodeMailerSettings>("CodeMailerSettings");

export namespace CodeMailerSettings {
    export type Interface = ICodeMailerSettings;
}
```

- [ ] **Step 2: Create the test helper for registering code settings**

Create `packages/api-mailer/__tests__/helpers/registerCodeSmtpSettings.ts`:

```ts
import { createContextPlugin } from "@webiny/api";
import { BuildParam } from "@webiny/api-core/features/buildParams/index.js";
import type { TransportSettings } from "~/types.js";

export const registerCodeSmtpSettings = (settings: TransportSettings) => {
    class CodeSmtpSettingsBuildParam implements BuildParam.Interface {
        public readonly key = "Mailer.SmtpSettings";
        public readonly value = settings;
    }

    const implementation = BuildParam.createImplementation({
        implementation: CodeSmtpSettingsBuildParam,
        dependencies: []
    });

    return createContextPlugin(context => {
        context.container.register(implementation);
    });
};
```

(This plugin is added to the plugin list of a test handler BEFORE the mailer context resolves `BuildParams`, so the BuildParam is in the container by the time `CodeMailerSettings.get(...)` runs.)

- [ ] **Step 3: Write the failing unit test**

Create `packages/api-mailer/__tests__/codeSettings.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createContextHandler } from "./contextHandler";
import { CodeMailerSettings } from "~/domain/CodeMailerSettings/abstractions.js";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";

const smtpSettings = {
    host: "smtp.example.com",
    port: 587,
    user: "user@example.com",
    password: "secret-password",
    from: "noreply@example.com",
    replyTo: "support@example.com"
};

describe("CodeMailerSettings", () => {
    it("returns null for any transport when no BuildParam is registered", async () => {
        const { handle } = createContextHandler();
        const context = await handle();
        const codeSettings = context.container.resolve(CodeMailerSettings);

        expect(codeSettings.get("Mailer/SmtpTransport")).toBeNull();
        expect(codeSettings.get("Mailer/DummyTransport")).toBeNull();
        expect(codeSettings.get("nonexistent")).toBeNull();
    });

    it("returns SMTP settings when the BuildParam is registered and the transport matches", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(smtpSettings)]
        });
        const context = await handle();
        const codeSettings = context.container.resolve(CodeMailerSettings);

        expect(codeSettings.get("Mailer/SmtpTransport")).toEqual(smtpSettings);
    });

    it("returns null for non-SMTP transports even when the BuildParam is registered", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(smtpSettings)]
        });
        const context = await handle();
        const codeSettings = context.container.resolve(CodeMailerSettings);

        expect(codeSettings.get("Mailer/DummyTransport")).toBeNull();
        expect(codeSettings.get("nonexistent")).toBeNull();
    });
});
```

- [ ] **Step 4: Run the test and confirm it fails**

```bash
yarn test packages/api-mailer --run __tests__/codeSettings.test.ts 2>&1 | tail -20
```

Expected: the `context.container.resolve(CodeMailerSettings)` call fails because there's no implementation registered yet. (Or the test module fails to import because `CodeMailerSettings` has no implementation file.)

- [ ] **Step 5: Implement `CodeMailerSettingsImpl`**

Create `packages/api-mailer/src/features/CodeMailerSettings/CodeMailerSettingsImpl.ts`:

```ts
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { CodeMailerSettings as Abstraction } from "~/domain/CodeMailerSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";

const SMTP_TRANSPORT_NAME = "Mailer/SmtpTransport";
const SMTP_BUILD_PARAM_KEY = "Mailer.SmtpSettings";

class CodeMailerSettingsImpl implements Abstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    get(transportName: string): TransportSettings | null {
        if (transportName !== SMTP_TRANSPORT_NAME) {
            return null;
        }
        const value = this.buildParams.get<TransportSettings>(SMTP_BUILD_PARAM_KEY);
        return value ?? null;
    }
}

export const CodeMailerSettings = Abstraction.createImplementation({
    implementation: CodeMailerSettingsImpl,
    dependencies: [BuildParams]
});
```

- [ ] **Step 6: Create the feature wiring**

Create `packages/api-mailer/src/features/CodeMailerSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CodeMailerSettings } from "./CodeMailerSettingsImpl.js";

export const CodeMailerSettingsFeature = createFeature({
    name: "Mailer/CodeMailerSettings",
    register(container) {
        container.register(CodeMailerSettings).inSingletonScope();
    }
});
```

- [ ] **Step 7: Register the feature in `createMailerContext`**

Edit `packages/api-mailer/src/index.ts`. Full final file:

```ts
import { createContextPlugin } from "@webiny/api";
import { CodeMailerSettingsFeature } from "~/features/CodeMailerSettings/feature.js";
import { GetSettingsFeature } from "~/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/features/SaveSettings/feature.js";
import { DummyTransportFeature } from "~/features/DummyTransport/feature.js";
import { SmtpTransportFeature } from "~/features/SmtpTransport/feature.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";
import { createSettingsGraphQL } from "~/graphql/settings.js";

export { MailerService } from "./domain/MailerService/abstractions.js";
export type { IMailerService, IMailerServiceErrors } from "./domain/MailerService/abstractions.js";

export const createMailerContext = () => {
    return createContextPlugin(context => {
        // Register all features.
        CodeMailerSettingsFeature.register(context.container);
        DummyTransportFeature.register(context.container);
        SmtpTransportFeature.register(context.container);
        GetSettingsFeature.register(context.container);
        SaveSettingsFeature.register(context.container);
        MailerServiceFeature.register(context.container);
        SendMailFeature.register(context.container);
    });
};

export const createMailerGraphQL = () => {
    return createSettingsGraphQL();
};
```

- [ ] **Step 8: Run the test — it must pass**

```bash
yarn test packages/api-mailer --run __tests__/codeSettings.test.ts 2>&1 | tail -20
```

Expected: 3 passed.

- [ ] **Step 9: Full suite (regression check)**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: all passing (18 total: 14 original + 1 ActiveTransport + 3 CodeMailerSettings).

- [ ] **Step 10: Commit**

```bash
git add packages/api-mailer/src/domain/CodeMailerSettings/ \
        packages/api-mailer/src/features/CodeMailerSettings/ \
        packages/api-mailer/src/index.ts \
        packages/api-mailer/__tests__/helpers/registerCodeSmtpSettings.ts \
        packages/api-mailer/__tests__/codeSettings.test.ts
git commit -m "$(cat <<'EOF'
feat(api-mailer): add CodeMailerSettings reading from BuildParams

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Migrate `GetSettingsRepository`, `GetSettingsUseCase`, `MailerService` together

**Why bundled:** `GetSettingsRepository.get()`'s signature change cascades into `GetSettingsUseCase` and `MailerService`. We update all three in one commit to keep the build green at every step. Existing tests must stay green after this task (asserting the new `{ settings, source }` shape where needed, still resolving to storage source because no BuildParam is registered).

**Files:**
- Modify: `packages/api-mailer/src/features/GetSettings/abstractions.ts`
- Modify: `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts`
- Modify: `packages/api-mailer/src/features/GetSettings/GetSettingsUseCase.ts`
- Modify: `packages/api-mailer/src/features/MailerService/MailerService.ts`
- Modify: `packages/api-mailer/__tests__/settings.crud.test.ts` (adapt to new return shape)

### Steps

- [ ] **Step 1: Update `GetSettings/abstractions.ts`**

Edit `packages/api-mailer/src/features/GetSettings/abstractions.ts`. Full final file:

```ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { TransportSettings } from "~/types.js";

export type MailerSettingsSource = "code" | "storage" | null;

export interface ISettingsWithSource {
    settings: TransportSettings | null;
    source: MailerSettingsSource;
}

export interface IGetSettingsRepository {
    get(transportName: string): Promise<Result<ISettingsWithSource>>;
}

export const GetSettingsRepository =
    createAbstraction<IGetSettingsRepository>("GetSettingsRepository");

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
    export type Return = Promise<Result<ISettingsWithSource>>;
}

export interface IGetSettingsUseCase {
    execute(transportName: string): Promise<Result<ISettingsWithSource>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
```

- [ ] **Step 2: Update `GetSettingsRepository.ts`**

Edit `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts`. Full final file:

```ts
import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetSettingsRepository, type ISettingsWithSource } from "./abstractions.js";
import { CodeMailerSettings } from "~/domain/CodeMailerSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";
import { MAILER_TRANSPORT_SETTINGS } from "~/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface,
        private codeSettings: CodeMailerSettings.Interface
    ) {}

    async get(transportName: string): Promise<Result<ISettingsWithSource>> {
        // Code-defined settings win over the KV store.
        const codeSettingsValue = this.codeSettings.get(transportName);
        if (codeSettingsValue !== null) {
            return Result.ok({
                settings: codeSettingsValue,
                source: "code"
            });
        }

        const result = await this.keyValueStore.get<TransportSettings>(MAILER_TRANSPORT_SETTINGS);

        if (result.isFail()) {
            return Result.ok({ settings: null, source: null });
        }

        const settings = result.value;
        if (!settings) {
            return Result.ok({ settings: null, source: null });
        }

        // Decrypt password if present.
        const password = settings.password
            ? this.encryption.decrypt(String(settings.password))
            : "";

        const transportSettings: TransportSettings = {
            host: String(settings.host || ""),
            port: Number(settings.port || 25),
            user: String(settings.user || ""),
            password,
            from: String(settings.from || ""),
            replyTo: settings.replyTo ? String(settings.replyTo) : undefined
        };

        return Result.ok({ settings: transportSettings, source: "storage" });
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption, CodeMailerSettings]
});
```

- [ ] **Step 3: Update `GetSettingsUseCase.ts`**

Edit `packages/api-mailer/src/features/GetSettings/GetSettingsUseCase.ts`. Full final file:

```ts
import { Result } from "@webiny/feature/api";
import {
    GetSettingsUseCase,
    GetSettingsRepository,
    type ISettingsWithSource
} from "./abstractions.js";

class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    execute(transportName: string): Promise<Result<ISettingsWithSource>> {
        return this.repository.get(transportName);
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
```

- [ ] **Step 4: Update `MailerService.ts` to use `ActiveTransport` and pass the transport name**

Edit `packages/api-mailer/src/features/MailerService/MailerService.ts`. Full final file:

```ts
import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import {
    ActiveTransport,
    MailTransport,
    MailTransportFactory
} from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "../GetSettings/abstractions.js";
import type { TransportSettings, TransportSendData } from "~/types.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(
        private getSettingsRepository: GetSettingsRepository.Interface,
        private activeTransport: ActiveTransport.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async sendMail<T = any>(data: TransportSendData): Abstraction.Return<T> {
        const transportName = this.activeTransport.name();

        if (!transportName) {
            return Result.fail(new NoTransportAvailableError());
        }

        const result = await this.getSettingsRepository.get(transportName);
        const { settings } = result.value;

        if (!settings) {
            return Result.fail(new NoSettingsConfiguredError());
        }

        const transport = await this.getTransport(settings);

        if (!transport) {
            return Result.fail(new NoTransportAvailableError());
        }

        try {
            const response = await transport.send(data);

            if (response.error) {
                return Result.fail(new TransportSendError(response.error));
            }

            return Result.ok(response);
        } catch (error) {
            return Result.fail(new TransportSendError(error));
        }
    }

    private async getTransport(
        settings: TransportSettings
    ): Promise<MailTransport.Interface | null> {
        if (this.transportFactories.length === 0) {
            return null;
        }

        const factory = this.transportFactories[this.transportFactories.length - 1];

        return factory.createTransport(settings);
    }
}

export const MailerService = Abstraction.createImplementation({
    implementation: MailerServiceImpl,
    dependencies: [
        GetSettingsRepository,
        ActiveTransport,
        [MailTransportFactory, { multiple: true }]
    ]
});
```

- [ ] **Step 5: Update `settings.crud.test.ts` call sites**

The existing test file calls `getSettings.execute()` with no argument. This now fails the type check. Edit `packages/api-mailer/__tests__/settings.crud.test.ts`:

For every occurrence of `await getSettings.execute()`, change to `await getSettings.execute("Mailer/SmtpTransport")`.

For every `expect(result.value).toEqual({ ... })` block that previously asserted the flat `TransportSettings` shape, wrap the expected object in the new `{ settings, source }` shape. Concretely:

- In `"should return response with password when getting settings"`:

```ts
expect(result.isOk()).toBe(true);
expect(result.value).toEqual({
    settings: {
        ...input,
        port: 25
    },
    source: "storage"
});
```

- In `"should be possible to update settings without password"`:

The `getSettings.execute(...)` call returns the new shape; update the `afterUpdate.value` assertion to:

```ts
expect(afterUpdate.isOk()).toBe(true);
expect(afterUpdate.value).toEqual({
    settings: {
        ...input,
        password: input.password,
        port: 25,
        host: "dummy-host2.webiny"
    },
    source: "storage"
});
```

- In `"should be possible to access settings when no permissions"`:

```ts
expect(result.isOk()).toBe(true);
expect(result.value).toEqual({
    settings: {
        ...input,
        port: 25
    },
    source: "storage"
});
```

(The assertions for `SaveSettings` return values — those that test `saveSettings.execute(...)` — stay on the flat `TransportSettings` shape. Only `GetSettings` results change.)

No other changes to this test file in this task — password masking is NOT added here yet (it lives in the GraphQL layer, handled in Task 7).

- [ ] **Step 6: Build**

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds.

- [ ] **Step 7: Full suite**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: all passing (18 tests). The `settings.crud.test.ts` assertions we updated must pass; others should be unaffected because `MailerService.sendMail()` still returns the same shape on success (the internal change is hidden).

- [ ] **Step 8: Commit**

```bash
git add packages/api-mailer/src/features/GetSettings/ \
        packages/api-mailer/src/features/MailerService/MailerService.ts \
        packages/api-mailer/__tests__/settings.crud.test.ts
git commit -m "$(cat <<'EOF'
refactor(api-mailer): get settings by transport name and expose source

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add `SettingsLockedByCode` error and reject `saveSettings` when code owns settings

**Why:** The "code wins" contract (D2a) means admin-initiated saves must fail loudly when code settings exist.

**Files:**
- Modify: `packages/api-mailer/src/domain/errors.ts`
- Modify: `packages/api-mailer/src/features/SaveSettings/abstractions.ts`
- Modify: `packages/api-mailer/src/features/SaveSettings/SaveSettingsUseCase.ts`

### Steps

- [ ] **Step 1: Add the `SettingsLockedByCode` error class**

Edit `packages/api-mailer/src/domain/errors.ts`. Append at the end of the file (after the last existing error class):

```ts
export class SettingsLockedByCode extends BaseError {
    override readonly code = "Mailer/Settings/LockedByCode" as const;

    constructor() {
        super({
            message: "Mailer settings are managed by code and cannot be saved via the API."
        });
    }
}
```

No other edits — leave the existing errors untouched.

- [ ] **Step 2: Add the error to `SaveSettings/abstractions.ts`**

Edit `packages/api-mailer/src/features/SaveSettings/abstractions.ts`. Update the error imports and the `ISaveSettingsErrors` interface. Concretely:

Find the line:

```ts
import {
    SettingsValidationError,
    SettingsPersistenceError,
    SettingsNotAuthorized
} from "~/domain/errors.js";
```

Change to:

```ts
import {
    SettingsValidationError,
    SettingsPersistenceError,
    SettingsNotAuthorized,
    SettingsLockedByCode
} from "~/domain/errors.js";
```

Find:

```ts
export interface ISaveSettingsErrors {
    validation: SettingsValidationError;
    persistence: SettingsPersistenceError;
    notAuthorized: SettingsNotAuthorized;
}
```

Change to:

```ts
export interface ISaveSettingsErrors {
    validation: SettingsValidationError;
    persistence: SettingsPersistenceError;
    notAuthorized: SettingsNotAuthorized;
    lockedByCode: SettingsLockedByCode;
}
```

All other types in this file derive from `ISaveSettingsErrors` and need no further change.

- [ ] **Step 3: Update `SaveSettingsUseCase.ts` to inject `CodeMailerSettings` + `ActiveTransport` and reject on conflict**

Edit `packages/api-mailer/src/features/SaveSettings/SaveSettingsUseCase.ts`. Full final file:

```ts
import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    type SaveSettingsInput
} from "./abstractions.js";
import { MailerSettingsBeforeSaveEvent, MailerSettingsAfterSaveEvent } from "./events.js";
import { saveValidation } from "./validation.js";
import {
    SettingsValidationError,
    SettingsPersistenceError,
    SettingsNotAuthorized,
    SettingsLockedByCode
} from "~/domain/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CodeMailerSettings } from "~/domain/CodeMailerSettings/abstractions.js";
import { ActiveTransport } from "~/domain/MailTransport/abstractions.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: SaveSettingsRepository.Interface,
        private codeSettings: CodeMailerSettings.Interface,
        private activeTransport: ActiveTransport.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission("mailer.settings");

        if (!permission) {
            return Result.fail(new SettingsNotAuthorized());
        }

        // Validate input.
        const validationResult = saveValidation.safeParse(input);
        if (!validationResult.success) {
            return Result.fail(new SettingsValidationError(validationResult.error.issues));
        }

        // Refuse when settings are defined via code.
        const transportName = this.activeTransport.name();
        if (transportName && this.codeSettings.get(transportName) !== null) {
            return Result.fail(new SettingsLockedByCode());
        }

        // Publish before save event.
        const beforeSaveEvent = new MailerSettingsBeforeSaveEvent({ input });
        await this.eventPublisher.publish(beforeSaveEvent);

        // Save settings.
        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        // Publish after save event.
        const afterSaveEvent = new MailerSettingsAfterSaveEvent({ settings: result.value });
        await this.eventPublisher.publish(afterSaveEvent);

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettingsUseCase.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [
        IdentityContext,
        EventPublisher,
        SaveSettingsRepository,
        CodeMailerSettings,
        ActiveTransport
    ]
});
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds.

- [ ] **Step 5: Full suite (regression check)**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: all 18 tests still passing. No test registers code settings yet, so `codeSettings.get(...)` returns null and the save path is unchanged.

- [ ] **Step 6: Commit**

```bash
git add packages/api-mailer/src/domain/errors.ts \
        packages/api-mailer/src/features/SaveSettings/abstractions.ts \
        packages/api-mailer/src/features/SaveSettings/SaveSettingsUseCase.ts
git commit -m "$(cat <<'EOF'
feat(api-mailer): reject saveSettings when mailer is configured via code

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update GraphQL layer — `source` field, password masking, transport resolution

**Why:** Expose the new source-aware return to the admin UI. Password masking changes the contract the UI reads. The resolver now needs `ActiveTransport` to know which transport to ask about.

**Files:**
- Modify: `packages/api-mailer/src/graphql/settings.ts`
- Modify: `packages/api-mailer/__tests__/settings.graphql.test.ts`
- Create: `packages/api-mailer/__tests__/settings.codeSource.test.ts`

### Steps

- [ ] **Step 1: Update GraphQL schema and resolvers**

Edit `packages/api-mailer/src/graphql/settings.ts`. Full final file:

```ts
import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import { ActiveTransport } from "~/domain/MailTransport/abstractions.js";
import type { Context } from "@webiny/api/types.js";
import type { TransportSettings } from "~/types.js";

const PASSWORD_MASK = "********";

const emptyResolver = () => ({});

const maskSettings = (
    settings: TransportSettings | null
): (Omit<TransportSettings, "password"> & { password: string }) | null => {
    if (!settings) {
        return null;
    }
    return {
        ...settings,
        password: settings.password ? PASSWORD_MASK : ""
    };
};

export const createSettingsGraphQL = () => {
    return new GraphQLSchemaPlugin<Context>({
        typeDefs: `
            type MailerTransportSettingsError {
                message: String!
                code: String
                data: JSON
            }

            type MailerTransportSettings {
                host: String
                port: Number
                user: String
                password: String
                from: String
                replyTo: String
            }

            type MailerTransportSettingsResponse {
                data: MailerTransportSettings
                source: String
                error: MailerTransportSettingsError
            }

            type MailerQuery {
                getSettings: MailerTransportSettingsResponse!
            }

            input MailerTransportSettingsInput {
                host: String!
                port: Number
                user: String!
                password: String
                from: String!
                replyTo: String
            }

            type MailerMutation {
                saveSettings(data: MailerTransportSettingsInput!): MailerTransportSettingsResponse!
            }

            extend type Query {
                mailer: MailerQuery
            }
            extend type Mutation {
                mailer: MailerMutation
            }
        `,
        resolvers: {
            Query: {
                mailer: emptyResolver
            },
            MailerQuery: {
                getSettings: async (_, __, context) => {
                    try {
                        const activeTransport = context.container.resolve(ActiveTransport);
                        const transportName = activeTransport.name();

                        if (!transportName) {
                            return new Response({ data: null, source: null });
                        }

                        const getSettings = context.container.resolve(GetSettingsUseCase);
                        const result = await getSettings.execute(transportName);

                        const { settings, source } = result.value;

                        return new Response({
                            data: maskSettings(settings),
                            source
                        });
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            },
            Mutation: {
                mailer: emptyResolver
            },
            MailerMutation: {
                saveSettings: async (_, args: any, context) => {
                    try {
                        const saveSettings = context.container.resolve(SaveSettingsUseCase);
                        const result = await saveSettings.execute(args.data);

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return new Response({
                            data: maskSettings(result.value),
                            source: "storage"
                        });
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            }
        }
    });
};
```

Key differences from the previous file:
- Adds `password: String` to `MailerTransportSettings`.
- Adds `source: String` to `MailerTransportSettingsResponse`.
- `MailerQuery.getSettings` resolves `ActiveTransport`, calls `GetSettingsUseCase.execute(transportName)`, and returns `{ data: maskSettings(settings), source }`.
- `MailerMutation.saveSettings` returns `{ data: maskSettings(result.value), source: "storage" }` on success. The `SettingsLockedByCode` error bubbles through `ErrorResponse` unchanged.
- Removes the old "strip password from response" logic — `maskSettings` replaces it.

- [ ] **Step 2: Update `settings.graphql.test.ts`**

Edit `packages/api-mailer/__tests__/settings.graphql.test.ts`. Changes:

**Inside `"should fetch settings and there should be nothing in it"`:**

Change the expected response to:

```ts
expect(response).toEqual({
    data: {
        mailer: {
            getSettings: {
                data: null,
                source: null,
                error: null
            }
        }
    }
});
```

**Inside `"should save settings and then fetch"`:**

`firstSaveResponse` expected value becomes:

```ts
expect(firstSaveResponse).toEqual({
    data: {
        mailer: {
            saveSettings: {
                data: {
                    from: "from@dummy-host.webiny",
                    host: "dummy-host.webiny",
                    password: "********",
                    replyTo: "replyTo@dummy-host.webiny",
                    user: "user"
                },
                source: "storage",
                error: null
            }
        }
    }
});
```

The first `getSettings` response:

```ts
expect(response).toEqual({
    data: {
        mailer: {
            getSettings: {
                data: {
                    from: "from@dummy-host.webiny",
                    host: "dummy-host.webiny",
                    password: "********",
                    replyTo: "replyTo@dummy-host.webiny",
                    user: "user"
                },
                source: "storage",
                error: null
            }
        }
    }
});
```

`secondSaveResponse`:

```ts
expect(secondSaveResponse).toEqual({
    data: {
        mailer: {
            saveSettings: {
                data: {
                    host: "dummy-host2.webiny",
                    user: "user2",
                    password: "********",
                    from: "from2@dummy-host.webiny",
                    replyTo: "replyTo2@dummy-host.webiny"
                },
                source: "storage",
                error: null
            }
        }
    }
});
```

`thirdSaveResponse` (the no-password update — stored password is preserved, so the mask still appears):

```ts
expect(thirdSaveResponse).toEqual({
    data: {
        mailer: {
            saveSettings: {
                data: {
                    host: "dummy-host3.webiny",
                    user: "user3",
                    password: "********",
                    from: "from3@dummy-host.webiny",
                    replyTo: "replyTo3@dummy-host.webiny"
                },
                source: "storage",
                error: null
            }
        }
    }
});
```

**Inside `"should not have access to saving settings"`** — unchanged (error path is unaffected).

The test uses a `createGraphQLHandler()` helper. That helper's GraphQL query definitions need updating too. Find them in `packages/api-mailer/__tests__/graphQLHandler.ts` (or wherever `handler.getSettings()` / `handler.saveSettings()` are defined) and add `source` and `password` to the selection set. If those selection strings need updating, include them in the same commit.

- [ ] **Step 3: Write the new integration test**

Create `packages/api-mailer/__tests__/settings.codeSource.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { createContextHandler } from "./contextHandler";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";
import type { TransportSendData } from "~/types";

vi.mock("nodemailer", () => {
    return {
        default: {
            createTransport: () => {
                return {
                    sendMail: async (params: TransportSendData) => {
                        return {
                            envelope: "envelope",
                            messageId: "123",
                            accepted: [params.to],
                            rejected: [],
                            pending: [],
                            response: "ok"
                        };
                    }
                };
            }
        }
    };
});

const codeSettings = {
    host: "code-host.webiny",
    port: 587,
    user: "code-user",
    password: "code-password",
    from: "code-from@example.com",
    replyTo: "code-reply@example.com"
};

describe("Mailer settings — code source end-to-end", () => {
    it("getSettings returns code-sourced data with masked password", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(codeSettings)]
        });
        const context = await handle();

        const getSettings = context.container.resolve(GetSettingsUseCase);
        const result = await getSettings.execute("Mailer/SmtpTransport");

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            settings: codeSettings,
            source: "code"
        });
    });

    it("saveSettings fails with SettingsLockedByCode when code settings exist", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(codeSettings)]
        });
        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        const result = await saveSettings.execute({
            host: "ignored.webiny",
            user: "ignored",
            password: "ignored",
            from: "ignored@example.com"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/Settings/LockedByCode");
    });

    it("sendMail succeeds using code-sourced SMTP settings", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(codeSettings)]
        });
        const context = await handle();

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute({
            to: ["to@example.com"],
            cc: [],
            bcc: [],
            from: "from@example.com",
            subject: "Hello",
            text: "Body"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            result: "ok",
            error: null
        });
    });
});
```

- [ ] **Step 4: Run the new integration test**

```bash
yarn test packages/api-mailer --run __tests__/settings.codeSource.test.ts 2>&1 | tail -30
```

Expected: 3 passed.

- [ ] **Step 5: Run the full suite**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: all passing — previously 18 tests, now 21 (added 3 code-source integration tests). All the updated `settings.graphql.test.ts` assertions pass with the new `source` + masked password values.

- [ ] **Step 6: Build**

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add packages/api-mailer/src/graphql/settings.ts \
        packages/api-mailer/__tests__/settings.graphql.test.ts \
        packages/api-mailer/__tests__/settings.codeSource.test.ts \
        packages/api-mailer/__tests__/graphQLHandler.ts
# Note: only include graphQLHandler.ts in the git add if Step 2 required edits to it.
git commit -m "$(cat <<'EOF'
feat(api-mailer): expose settings source and always mask password in GraphQL

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add the `<Infra.Mailer.Smtp>` project-aws extension

**Why:** Now that the runtime reads `Mailer.SmtpSettings` BuildParams, users need a component to emit that BuildParam from `webiny.config.tsx`.

**Files:**
- Create: `packages/project-aws/src/extensions/Mailer/Smtp.tsx`
- Modify: `packages/project-aws/src/extensions/index.ts`
- Modify: `packages/project-aws/src/extensions/definitions.ts`
- Modify: `packages/project-aws/src/infra.ts`

### Steps

- [ ] **Step 1: Create the component**

Create `packages/project-aws/src/extensions/Mailer/Smtp.tsx`:

```tsx
import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

export const Smtp = defineExtension({
    type: "Infra/Mailer/Smtp",
    tags: { runtimeContext: "project" },
    description: "Configure mailer SMTP transport settings via code.",
    paramsSchema: z.object({
        host: z.string().min(1).describe("SMTP server hostname."),
        port: z.number().int().positive().describe("SMTP server port."),
        user: z.string().min(1).describe("SMTP authentication username."),
        password: z.string().min(1).describe("SMTP authentication password."),
        from: z.string().email().describe("Default 'from' address."),
        replyTo: z.string().email().optional().describe("Default 'reply-to' address.")
    }),
    render(params) {
        return <BuildParam paramName="Mailer.SmtpSettings" value={params} />;
    }
});
```

- [ ] **Step 2: Re-export from the extensions index**

Edit `packages/project-aws/src/extensions/index.ts`. Full final file:

```ts
export * from "./OpenSearch.js";
export * from "./AwsDefaultRegion.js";
export * from "./ProjectAws/AutoInstall.js";
export * from "./ProjectAws.js";
export * from "./ApiLambdaFunction.js";
export * from "./ApiRoute.js";
export * from "./Encryption.js";
export { Smtp as MailerSmtp } from "./Mailer/Smtp.js";
```

- [ ] **Step 3: Add the definition**

Edit `packages/project-aws/src/extensions/definitions.ts`. Full final file:

```ts
import { ApiLambdaFunction } from "./ApiLambdaFunction.js";
import { ApiRoute } from "./ApiRoute.js";
import { OpenSearch } from "./OpenSearch.js";
import { Encryption } from "./Encryption.js";
import { Smtp as MailerSmtp } from "./Mailer/Smtp.js";
import { type ExtensionDefinitionModel } from "@webiny/project/defineExtension";

const definitions = [
    ApiLambdaFunction.def,
    ApiRoute.def,
    OpenSearch.def,
    Encryption.def,
    MailerSmtp.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
```

- [ ] **Step 4: Expose under `Infra.Mailer.Smtp`**

Edit `packages/project-aws/src/infra.ts`. Full final file:

```ts
import {
    AdminAfterBuild,
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeDeploy,
    AdminBeforeWatch,
    AdminPulumi,
    AdminStackOutputValue,
    ApiAfterBuild,
    ApiAfterDeploy,
    ApiBeforeBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    ApiPulumi,
    ApiStackOutputValue,
    CoreAfterBuild,
    CoreAfterDeploy,
    CoreBeforeBuild,
    CoreBeforeDeploy,
    CoreBeforeWatch,
    CorePulumi,
    CoreStackOutputValue,
    ProductionEnvironments,
    PulumiResourceNamePrefix
} from "@webiny/project/extensions/index.js";

import {
    AdminCustomDomains,
    ApiCustomDomains,
    AwsTags,
    BlueGreenDeployments,
    Vpc
} from "./pulumi/extensions/index.js";

import { OpenSearch } from "./extensions/OpenSearch.js";
import { AwsDefaultRegion } from "./extensions/AwsDefaultRegion.js";
import { Encryption } from "./extensions/Encryption.js";
import { ApiLambdaFunction } from "./extensions/ApiLambdaFunction.js";
import { Smtp as MailerSmtp } from "./extensions/Mailer/Smtp.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { EnvIs, EnvIsNot, CiIs, CiIsNot } from "@webiny/project/extensions/infra/index.js";

export const Infra = {
    Encryption,
    Vpc,
    BlueGreenDeployments,
    OpenSearch,
    PulumiResourceNamePrefix,
    ProductionEnvironments,
    EnvVar,
    Mailer: {
        Smtp: MailerSmtp
    },
    Aws: {
        DefaultRegion: AwsDefaultRegion,
        Tags: AwsTags
    },
    Env: {
        Is: EnvIs,
        IsNot: EnvIsNot
    },
    Ci: {
        Is: CiIs,
        IsNot: CiIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild,
        BeforeDeploy: AdminBeforeDeploy,
        BeforeWatch: AdminBeforeWatch,
        AfterBuild: AdminAfterBuild,
        AfterDeploy: AdminAfterDeploy,
        Pulumi: AdminPulumi,
        CustomDomains: AdminCustomDomains,
        StackOutputValue: AdminStackOutputValue
    },
    Api: {
        BeforeBuild: ApiBeforeBuild,
        BeforeDeploy: ApiBeforeDeploy,
        BeforeWatch: ApiBeforeWatch,
        AfterBuild: ApiAfterBuild,
        AfterDeploy: ApiAfterDeploy,
        Pulumi: ApiPulumi,
        CustomDomains: ApiCustomDomains,
        StackOutputValue: ApiStackOutputValue,
        LambdaFunction: ApiLambdaFunction
    },
    Core: {
        BeforeBuild: CoreBeforeBuild,
        BeforeDeploy: CoreBeforeDeploy,
        BeforeWatch: CoreBeforeWatch,
        AfterBuild: CoreAfterBuild,
        AfterDeploy: CoreAfterDeploy,
        Pulumi: CorePulumi,
        StackOutputValue: CoreStackOutputValue
    }
};
```

- [ ] **Step 5: Build project-aws**

```bash
yarn build -p @webiny/project-aws 2>&1 | tail -30
```

Expected: build succeeds.

- [ ] **Step 6: Smoke-check via `webiny.config.tsx`**

The repo's `webiny.config.tsx` already references `<Infra.Mailer.Smtp>` in a commented line? Confirm by reading the file and grep. If present uncommented, verify TypeScript is satisfied by running:

```bash
yarn tsc --noEmit -p webiny.config.tsx 2>&1 | tail -20
```

(If that exact tsc invocation doesn't work for a standalone file, just run `yarn build` at the project root on a package that transitively typechecks webiny.config.tsx — or simply rely on the next task's admin UI build to surface any issues.)

Expected: no type errors referencing `Infra.Mailer.Smtp`. If TypeScript complains that `Smtp` expects certain props, verify the schema in Step 1 matches what's documented in the spec (host/port/user/password/from required, replyTo optional).

- [ ] **Step 7: Commit**

```bash
git add packages/project-aws/src/extensions/Mailer/ \
        packages/project-aws/src/extensions/index.ts \
        packages/project-aws/src/extensions/definitions.ts \
        packages/project-aws/src/infra.ts
git commit -m "$(cat <<'EOF'
feat(project-aws): add Infra.Mailer.Smtp extension for code-driven mailer config

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Update the admin UI to read `source` and render read-only when code-defined

**Why:** Without this, the admin UI can still submit saves that will fail with `SettingsLockedByCode`. The banner communicates that the form is code-managed.

**Files:**
- Modify: `packages/app-mailer/src/views/settings/graphql.ts`
- Modify: `packages/app-mailer/src/views/settings/Settings.tsx`

### Steps

- [ ] **Step 1: Update the GraphQL queries to include `source` and `password`**

Edit `packages/app-mailer/src/views/settings/graphql.ts`. Full final file:

```ts
import gql from "graphql-tag";
import type { ApiError, TransportSettings, ValidationErrors } from "~/types.js";

const SETTINGS_FIELDS = `
    {
        host
        port
        user
        password
        from
        replyTo
    }
`;

const ERROR_FIELDS = `
    {
        message
        code
        data
    }
`;

export type MailerSettingsSource = "code" | "storage" | null;

export interface SettingsQueryResponse {
    mailer: {
        settings: {
            data: TransportSettings | null;
            source: MailerSettingsSource;
            error: ApiError | null;
        };
    };
}
export const GET_SETTINGS_QUERY = gql`
    query GetMailerSettings {
        mailer {
            settings: getSettings {
                data ${SETTINGS_FIELDS}
                source
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export interface SaveSettingsMutationVariables {
    data: TransportSettings & {
        password?: string;
    };
}

export interface SaveSettingsMutationResponse {
    mailer: {
        settings: {
            data: TransportSettings | null;
            source: MailerSettingsSource;
            error: ApiError<ValidationErrors> | null;
        };
    };
}
export const SAVE_SETTINGS_MUTATION = gql`
    mutation SaveTransportSettings($data: MailerTransportSettingsInput!) {
        mailer {
            settings: saveSettings(data: $data) {
                data ${SETTINGS_FIELDS}
                source
                error ${ERROR_FIELDS}
            }
        }
    }
`;
```

- [ ] **Step 2: Add the read-only branch in `Settings.tsx`**

Edit `packages/app-mailer/src/views/settings/Settings.tsx`. After the `const { data: settingsData, error: settingsError } = response?.mailer.settings || {};` destructuring (around line 73), also destructure `source`. Then insert a new branch before the existing form render:

Locate this existing block (around the `if (settingsError)` branch):

```tsx
const { data: settingsData, error: settingsError } =
    response?.mailer.settings || {};
const { loading: mutationInProgress } = result;

const onSubmit = async (data: TransportSettings): Promise<void> => {
```

Change the destructuring to include `source`:

```tsx
const {
    data: settingsData,
    error: settingsError,
    source: settingsSource
} = response?.mailer.settings || {};
const { loading: mutationInProgress } = result;

const onSubmit = async (data: TransportSettings): Promise<void> => {
```

Then, ABOVE the `if (settingsError)` block, insert:

```tsx
if (settingsSource === "code") {
    return (
        <CenteredView>
            <SimpleForm>
                <SimpleFormHeader title="Mailer Settings" />
                <SimpleFormContent>
                    <Grid>
                        <Grid.Column span={12}>
                            <Alert title="Managed by code" type="info">
                                Mailer settings are managed by code. Edit
                                <code> webiny.config.tsx </code>
                                to change them.
                            </Alert>
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Input
                                size="lg"
                                type="text"
                                label="Hostname"
                                value={settingsData?.host ?? ""}
                                disabled
                            />
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Input
                                size="lg"
                                type="number"
                                label="Port"
                                value={String(settingsData?.port ?? "")}
                                disabled
                            />
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Input
                                size="lg"
                                type="text"
                                label="User"
                                value={settingsData?.user ?? ""}
                                disabled
                            />
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Input
                                size="lg"
                                type="password"
                                label="Password"
                                value={settingsData?.password ?? ""}
                                disabled
                            />
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Input
                                size="lg"
                                type="text"
                                label="From"
                                value={settingsData?.from ?? ""}
                                disabled
                            />
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Input
                                size="lg"
                                type="text"
                                label="Reply-To"
                                value={settingsData?.replyTo ?? ""}
                                disabled
                            />
                        </Grid.Column>
                    </Grid>
                </SimpleFormContent>
                <SimpleFormFooter>{""}</SimpleFormFooter>
            </SimpleForm>
        </CenteredView>
    );
}
```

Leave everything else in the file unchanged. The editable form branch still handles `source === "storage"` and `source === null` cases correctly because the `<Form>` below uses `<Bind>`-driven inputs that pre-fill from `settingsData` — now `settingsData.password` is `"********"` when a password exists. To prevent "`********`" from being treated as a real password on save, keep the existing `useEffect` that clears the password ref on mount — it already handles that case.

- [ ] **Step 3: Build app-mailer**

```bash
yarn build -p @webiny/app-mailer 2>&1 | tail -30
```

Expected: build succeeds. If TypeScript complains about the `settingsSource` destructuring, confirm that `SettingsQueryResponse` now exposes `source` (Step 1).

- [ ] **Step 4: Run any app-mailer tests**

```bash
yarn test packages/app-mailer 2>&1 | tail -20
```

Expected: whatever is there passes (`app-mailer` may have no tests; if no test config exists, the command will say so — that's fine).

- [ ] **Step 5: Commit**

```bash
git add packages/app-mailer/src/views/settings/graphql.ts \
        packages/app-mailer/src/views/settings/Settings.tsx
git commit -m "$(cat <<'EOF'
feat(app-mailer): render read-only settings form when mailer is code-managed

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Preflight

**Why:** Project convention — run every check in the `CLAUDE.md` "Before Commit" checklist across the full branch before opening the PR.

### Steps

- [ ] **Step 1: Stage (baseline check)**

```bash
git status
```

Expected: clean tree on `bruno/feat/api-mailer/code-config`.

- [ ] **Step 2: Refresh dependencies**

```bash
yarn > /dev/null 2>&1
```

Expected: exit 0, silent.

- [ ] **Step 3: Regenerate tsconfigs**

```bash
node scripts/generateTsConfigsInPackages.js 2>&1 | tail -10
```

Expected: completes without error. If new/changed tsconfigs appear in `git status`, that's fine — stage them in Step 9.

- [ ] **Step 4: Dependency declarations**

```bash
yarn adio 2>&1 | tail -20
```

Expected: pass. If it flags a missing dep somewhere (new imports in this branch might surface a dep not declared), add it to the appropriate `package.json` and re-run.

- [ ] **Step 5: Format**

```bash
yarn format > /dev/null 2>&1 && git status --short
```

Report what was modified (oxfmt auto-fixes).

- [ ] **Step 6: Lint**

```bash
yarn eslint 2>&1 | tail -20
```

Expected: pass. Fix trivial issues in files this branch touched (unused imports, etc.) — don't touch unrelated eslint hits.

- [ ] **Step 7: Sync workspace deps**

```bash
yarn webiny sync-dependencies 2>&1 | tail -20
```

Expected: exit 0, possibly reports patch/semver warnings (pre-existing).

- [ ] **Step 8: Full mailer test suite one more time**

```bash
yarn test packages/api-mailer 2>&1 | tail -30
```

Expected: 21 tests passing (14 pre-existing + 1 ActiveTransport + 3 CodeMailerSettings + 3 code-source integration).

- [ ] **Step 9: Stage any preflight-produced changes and commit**

```bash
git status --short
git add .
git commit -m "$(cat <<'EOF'
chore: preflight cleanup (tsconfig regen, format, deps sync)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" || echo "No preflight-induced changes — nothing to commit."
```

- [ ] **Step 10: Final status + log**

```bash
git status
git log --oneline main..HEAD 2>&1 | head -20
```

Report the final commit list to the user so they can review before pushing / opening the PR.

---

## Success criteria

After all tasks land, verify:

- [ ] `<Infra.Mailer.Smtp host="..." port={587} user="..." password={process.env.SMTP_PASSWORD!} from="..." replyTo="..." />` in `webiny.config.tsx` type-checks and builds.
- [ ] `CodeMailerSettings.get("Mailer/SmtpTransport")` returns the BuildParam value at runtime; returns `null` for any other name.
- [ ] `GetSettingsRepository.get("Mailer/SmtpTransport")` returns `{ settings, source: "code" }` when the BuildParam is set; falls back to `{ settings, source: "storage" }` or `{ settings: null, source: null }` otherwise.
- [ ] `MailerService.sendMail` still works end-to-end — integration test `settings.codeSource.test.ts::sendMail succeeds using code-sourced SMTP settings` passes.
- [ ] `SaveSettingsUseCase.execute(...)` fails with `Mailer/Settings/LockedByCode` when code settings exist for the active transport.
- [ ] GraphQL `getSettings` response includes `source` (values: `"code" | "storage" | null`); `password` in the response is always `"********"` when a password is configured, `""` otherwise.
- [ ] Admin UI renders a read-only banner + disabled inputs when `source === "code"`, and the editable form otherwise.
- [ ] `yarn test packages/api-mailer` is green (21 tests).
- [ ] `yarn build -p @webiny/api-mailer`, `yarn build -p @webiny/project-aws`, `yarn build -p @webiny/app-mailer` all succeed.
- [ ] `yarn adio` clean; `yarn eslint` clean.
