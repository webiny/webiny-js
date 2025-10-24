# Core Features Reference

This document provides the correct import paths and type definitions for commonly used features in the Webiny backend codebase (packages named with `api-*`).

**How to use this document:**
1. Find the feature you need to use
2. Copy the exact import path
3. Read the linked TypeScript file to see the complete interface and available methods

---

## Features

### TenantContext
- **Import:** `import { TenantContext } from "@webiny/api-tenancy/features/TenantContext"`
- **Interface Type:** See `packages/api-tenancy/src/features/TenantContext/abstractions.ts`
- **Usage:** Access current tenant information

### IdentityContext
- **Import:** `import { IdentityContext } from "@webiny/api-security/features/IdentityContext"`
- **Interface Type:** See `packages/api-security/src/features/IdentityContext/abstractions.ts`
- **Usage:** Access current user identity and permissions

### EventPublisher
- **Import:** `import { EventPublisher } from "@webiny/api-core"`
- **Interface Type:** See `packages/api-core/src/event-publisher/abstractions.ts`
- **Usage:** Publish domain events

### WcpContext
- **Import:** `import { WcpContext } from "@webiny/api-wcp/features/WcpContext"`
- **Interface Type:** See `packages/api-wcp/src/features/WcpContext/abstractions.ts`
- **Usage:** WCP (Webiny Control Panel) integration for seats/tenants management

---

## Notes

- Always import abstractions from the feature path (not from package root)
- Use `Feature.Interface` type for constructor parameters
- Read the actual TypeScript interface file to see all available methods
- Interface files follow the pattern: `abstractions.ts` in the feature folder
