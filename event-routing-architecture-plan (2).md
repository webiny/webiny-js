# Event Handling & HTTP Routing Architecture - Implementation Plan

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Package Structure](#package-structure)
3. [Core Event System](#core-event-system)
4. [HTTP Routing System](#http-routing-system)
5. [Tenant Context System](#tenant-context-system)
6. [AWS Infrastructure Adapters](#aws-infrastructure-adapters)
7. [Feature Registration](#feature-registration)
8. [Lambda Handler Setup](#lambda-handler-setup)
9. [Migration Strategy](#migration-strategy)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Key Principles

1. **Cloud Agnostic Core** - HTTP routing works on any cloud platform
2. **Event Type Detection** - Lightweight detection before dependency resolution
3. **Middleware Chain** - Handlers can call `next()` for request processing
4. **Decorator Pattern** - Cross-cutting concerns wrap core functionality
5. **Tenant Isolation** - Per-request container with tenant context
6. **Type Safety** - Full TypeScript support throughout

### Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  Lambda Entry Point (Per-Request Container)     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Event Dispatcher (Matches & Chains Handlers)   │
└──────────────────┬──────────────────────────────┘
                   │
    ┌──────────────┴─────────────┐
    │                            │
┌───▼──────────────┐  ┌──────────▼───────────────┐
│  HTTP System     │  │  Cloud-Specific Events   │
│  (Cloud Agnostic)│  │  (S3, SQS, SNS, etc.)    │
└──────────────────┘  └──────────────────────────┘
```

---

## Package Structure

```
packages/
├── core/
│   └── features/
│       ├── events/                    # Generic event system
│       │   ├── abstractions.ts
│       │   ├── EventDispatcher.ts
│       │   └── feature.ts
│       ├── http/                      # Cloud-agnostic HTTP
│       │   ├── abstractions.ts
│       │   ├── HttpRouter.ts
│       │   ├── decorators/
│       │   │   ├── TenantInitializerDecorator.ts
│       │   │   └── SecureHeadersDecorator.ts
│       │   ├── routes/
│       │   │   ├── GraphQLRoute.ts
│       │   │   └── FilesRoute.ts
│       │   └── feature.ts
│       └── tenancy/                   # Multi-tenancy
│           ├── abstractions.ts
│           ├── TenantContext.ts
│           ├── LoadTenant/
│           │   └── LoadTenantUseCase.ts
│           ├── extractors/
│           │   └── HttpTenantIdExtractor.ts
│           └── feature.ts
└── aws/
    └── features/
        ├── ApiGateway/               # AWS HTTP adapter
        │   ├── ApiGatewayEventType.ts
        │   ├── ApiGatewayEventHandler.ts
        │   └── abstractions.ts
        ├── S3/                       # AWS S3 events
        │   ├── S3EventType.ts
        │   ├── S3EventHandler.ts
        │   ├── S3TenantIdExtractor.ts
        │   └── abstractions.ts
        ├── SQS/                      # AWS SQS events
        └── feature.ts
```

---

## Core Event System

### Step 1: Event Abstractions

**File:** `packages/core/features/events/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";

// ============================================================================
// Event Context (Flows through middleware chain)
// ============================================================================

export interface EventContext<TEvent = any> {
  event: TEvent;
  metadata: Record<string, any>;
}

export type NextFunction<TEvent = any, TResult = any> = (
  context?: EventContext<TEvent>
) => Promise<TResult>;

// ============================================================================
// Event Handler (with middleware chain support)
// ============================================================================

export interface IEventHandler<TEvent = any, TResult = any> {
  handle(
    context: EventContext<TEvent>,
    next: NextFunction<TEvent, TResult>
  ): Promise<TResult>;
}

export const EventHandler = createAbstraction<IEventHandler>("EventHandler");

export namespace EventHandler {
  export type Interface = IEventHandler;
}

// ============================================================================
// Event Type (Lightweight detection + handler reference)
// ============================================================================

export interface IEventType<TEvent = any> {
  canHandle(event: any): event is TEvent;
  getHandlerAbstraction(): Abstraction<IEventHandler<TEvent, any>>;
}

export const EventType = createAbstraction<IEventType>("EventType");

export namespace EventType {
  export type Interface = IEventType;
}

// ============================================================================
// Event Dispatcher (Orchestrates event routing)
// ============================================================================

export interface IEventDispatcher {a je
  dispatch<TEvent, TResult>(event: TEvent): Promise<TResult>;
}

export const EventDispatcher = createAbstraction<IEventDispatcher>("EventDispatcher");

export namespace EventDispatcher {
  export type Interface = IEventDispatcher;
}
```

### Step 2: Event Dispatcher Implementation

**File:** `packages/core/features/events/EventDispatcher.ts`

```typescript
import { EventDispatcher as Abstraction, EventType, EventContext } from "./abstractions";
import { NoHandlerFoundError } from "./errors";
import type { Container } from "@webiny/di";

class EventDispatcherImpl implements Abstraction.Interface {
  constructor(
    private eventTypes: EventType.Interface[],
    private container: Container // Only dispatcher has container access
  ) {}

  async dispatch<TEvent, TResult>(event: TEvent): Promise<TResult> {
    // Step 1: Find matching event type (cheap, no DI resolution)
    const eventType = this.eventTypes.find(type => type.canHandle(event));
    
    if (!eventType) {
      throw new NoHandlerFoundError("No event type matched the incoming event");
    }

    // Step 2: Get the handler abstraction for this event type
    const handlerAbstraction = eventType.getHandlerAbstraction();

    // Step 3: Resolve ALL handlers for this type (for middleware chain)
    const handlers = this.container.resolveAll(handlerAbstraction);

    if (handlers.length === 0) {
      throw new NoHandlerFoundError(
        `No handlers registered for ${handlerAbstraction.toString()}`
      );
    }

    // Step 4: Create initial context
    const context: EventContext<TEvent> = {
      event,
      metadata: {}
    };

    // Step 5: Build and execute middleware chain
    return this.executeChain(context, handlers);
  }

  private async executeChain(
    initialContext: EventContext<any>,
    handlers: IEventHandler[]
  ): Promise<any> {
    // Last registered handler runs first
    let index = handlers.length - 1;

    const next = async (context?: EventContext<any>): Promise<any> => {
      if (index < 0) {
        throw new Error("No more handlers in chain");
      }

      const handler = handlers[index];
      index--;
      
      // Use provided context or initial context
      const currentContext = context || initialContext;
      
      return handler.handle(currentContext, next);
    };

    return next(initialContext);
  }
}

export const EventDispatcherImpl = Abstraction.createImplementation({
  implementation: EventDispatcherImpl,
  dependencies: [
    [EventType, { multiple: true }],
    Container // Special: dispatcher needs container for lazy resolution
  ]
});
```

### Step 3: Events Feature

**File:** `packages/core/features/events/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { EventDispatcherImpl } from "./EventDispatcher";

export const EventsFeature = createFeature({
  name: "Events",
  register(container) {
    container.register(EventDispatcherImpl).inSingletonScope();
  }
});
```

### Step 4: Error Definitions

**File:** `packages/core/features/events/errors.ts`

```typescript
import { BaseError } from "@webiny/feature/api";

export class NoHandlerFoundError extends BaseError {
  override readonly code = "NO_HANDLER_FOUND" as const;

  constructor(message?: string) {
    super({
      message: message || "No handler found for event",
      data: {}
    });
  }
}
```

---

## HTTP Routing System

### Step 1: HTTP Abstractions

**File:** `packages/core/features/http/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";

// ============================================================================
// HTTP Request/Response (Cloud Agnostic)
// ============================================================================

export interface IHttpRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
  pathParameters: Record<string, string>;
}

export interface IHttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

// ============================================================================
// HTTP Route (Combines route definition + handler)
// ============================================================================

export interface IHttpRoute {
  readonly method: string;
  readonly path: string;
  handle(request: IHttpRequest): Promise<IHttpResponse>;
}

export const HttpRoute = createAbstraction<IHttpRoute>("HttpRoute");

export namespace HttpRoute {
  export type Interface = IHttpRoute;
}

// ============================================================================
// HTTP Router (Matches routes and executes handlers)
// ============================================================================

export interface IHttpRouter {
  route(request: IHttpRequest): Promise<IHttpResponse>;
}

export const HttpRouter = createAbstraction<IHttpRouter>("HttpRouter");

export namespace HttpRouter {
  export type Interface = IHttpRouter;
}
```

### Step 2: HTTP Router Implementation

**File:** `packages/core/features/http/HttpRouter.ts`

```typescript
import { HttpRouter as Abstraction, HttpRoute } from "./abstractions";
import { RouteNotFoundError } from "./errors";

class HttpRouterImpl implements Abstraction.Interface {
  constructor(private routes: HttpRoute.Interface[]) {}

  async route(request: IHttpRequest): Promise<IHttpResponse> {
    // Find matching route
    for (const route of this.routes) {
      if (this.matches(route, request)) {
        return route.handle(request);
      }
    }

    throw new RouteNotFoundError(request.method, request.path);
  }

  private matches(route: HttpRoute.Interface, request: IHttpRequest): boolean {
    // Method must match
    if (route.method !== request.method) {
      return false;
    }

    // Wildcard path matching
    if (route.path.endsWith("/*")) {
      const prefix = route.path.slice(0, -2);
      return request.path.startsWith(prefix);
    }

    // Exact path matching
    return route.path === request.path;
  }
}

export const HttpRouterImpl = Abstraction.createImplementation({
  implementation: HttpRouterImpl,
  dependencies: [[HttpRoute, { multiple: true }]]
});
```

### Step 3: Example HTTP Route

**File:** `packages/core/features/http/routes/GraphQLRoute.ts`

```typescript
import { HttpRoute } from "../abstractions";
import { GraphQLEngine } from "../../graphql/abstractions";

class GraphQLRoute implements HttpRoute.Interface {
  readonly method = "POST";
  readonly path = "/graphql";

  constructor(private graphqlEngine: GraphQLEngine.Interface) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const result = await this.graphqlEngine.execute(request.body);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: result
    };
  }
}

export const GraphQLRouteImpl = HttpRoute.createImplementation({
  implementation: GraphQLRoute,
  dependencies: [GraphQLEngine]
});
```

**File:** `packages/core/features/http/routes/FilesRoute.ts`

```typescript
import { HttpRoute } from "../abstractions";
import { FileStorage } from "../../storage/abstractions";

class FilesRoute implements HttpRoute.Interface {
  readonly method = "GET";
  readonly path = "/files/*";

  constructor(private storage: FileStorage.Interface) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const key = request.path.replace("/files/", "");
    const file = await this.storage.get(key);
    
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000"
      },
      body: file.content
    };
  }
}

export const FilesRouteImpl = HttpRoute.createImplementation({
  implementation: FilesRoute,
  dependencies: [FileStorage]
});
```

### Step 4: Secure Headers Decorator

**File:** `packages/core/features/http/decorators/SecureHeadersDecorator.ts`

```typescript
import { HttpRouter } from "../abstractions";

class SecureHeadersDecorator implements HttpRouter.Interface {
  private readonly whitelistedHeaders = [
    "accept",
    "authorization",
    "cache-control",
    "content-type",
    "x-i18n-locale",
    "x-tenant",
    "x-apollo-tracing",
    "apollo-query-plan-experimental"
  ];

  constructor(private decoratee: HttpRouter.Interface) {}

  async route(request: IHttpRequest): Promise<IHttpResponse> {
    const isOptions = request.method === "OPTIONS";

    // Handle OPTIONS early (no need to route)
    if (isOptions) {
      return this.createOptionsResponse(request);
    }

    // Route to actual handler
    const response = await this.decoratee.route(request);

    // Add security headers to response
    return this.addSecurityHeaders(request, response);
  }

  private createOptionsResponse(request: IHttpRequest): IHttpResponse {
    return {
      statusCode: 204,
      headers: {
        "access-control-allow-origin": request.headers["origin"] || "*",
        "access-control-allow-credentials": "true",
        "cache-control": "public, max-age=86400",
        "content-type": "application/json; charset=utf-8",
        "access-control-max-age": "86400",
        "access-control-allow-methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
        "access-control-allow-headers": this.whitelistedHeaders.join(", ")
      },
      body: null
    };
  }

  private addSecurityHeaders(
    request: IHttpRequest,
    response: IHttpResponse
  ): IHttpResponse {
    return {
      ...response,
      headers: {
        ...response.headers,
        "access-control-allow-origin": request.headers["origin"] || "*",
        "access-control-allow-credentials": "true",
        "x-tenant": request.headers["x-tenant"] || "root",
        "vary": "origin"
      }
    };
  }
}

export const SecureHeadersDecoratorImpl = HttpRouter.createDecorator({
  decorator: SecureHeadersDecorator,
  dependencies: []
});
```

### Step 5: HTTP Feature Registration

**File:** `packages/core/features/http/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { HttpRouterImpl } from "./HttpRouter";
import { SecureHeadersDecoratorImpl } from "./decorators/SecureHeadersDecorator";
import { GraphQLRouteImpl } from "./routes/GraphQLRoute";
import { FilesRouteImpl } from "./routes/FilesRoute";

export const HttpFeature = createFeature({
  name: "Http",
  register(container) {
    // Register router
    container.register(HttpRouterImpl).inSingletonScope();
    
    // Register decorators (order: last registered runs first)
    container.registerDecorator(SecureHeadersDecoratorImpl);
    
    // Register routes
    container.register(GraphQLRouteImpl);
    container.register(FilesRouteImpl);
  }
});
```

### Step 6: HTTP Error Definitions

**File:** `packages/core/features/http/errors.ts`

```typescript
import { BaseError } from "@webiny/feature/api";

export class RouteNotFoundError extends BaseError<{ method: string; path: string }> {
  override readonly code = "ROUTE_NOT_FOUND" as const;

  constructor(method: string, path: string) {
    super({
      message: `Route not found: ${method} ${path}`,
      data: { method, path }
    });
  }
}

export class HttpHandlerError extends BaseError {
  override readonly code = "HTTP_HANDLER_ERROR" as const;

  constructor(message: string) {
    super({
      message,
      data: {}
    });
  }
}
```

---

## Tenant Context System

### Step 1: Tenant Abstractions

**File:** `packages/core/features/tenancy/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";

// ============================================================================
// Tenant Entity (Domain)
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  status: "active" | "suspended" | "deleted";
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Tenant Context (Request-scoped singleton)
// ============================================================================

export interface ITenantContext {
  get(): Tenant | undefined;
  set(tenant: Tenant): void;
  requireTenant(): Tenant; // Throws if not set
}

export const TenantContext = createAbstraction<ITenantContext>("TenantContext");

export namespace TenantContext {
  export type Interface = ITenantContext;
}

// ============================================================================
// Load Tenant Use Case
// ============================================================================

export interface ILoadTenant {
  execute(tenantId: string): Promise<Result<Tenant, LoadTenant.Error>>;
}

export const LoadTenant = createAbstraction<ILoadTenant>("LoadTenant");

export namespace LoadTenant {
  export type Interface = ILoadTenant;
  export type Error = TenantNotFoundError | TenantLoadError;
}
```

### Step 2: Tenant Context Implementation

**File:** `packages/core/features/tenancy/TenantContext.ts`

```typescript
import { TenantContext as Abstraction } from "./abstractions";
import { TenantNotSetError } from "./errors";

class TenantContextImpl implements Abstraction.Interface {
  private tenant?: Tenant;

  get(): Tenant | undefined {
    return this.tenant;
  }

  set(tenant: Tenant): void {
    if (this.tenant) {
      throw new Error("Tenant already set in this context");
    }
    this.tenant = tenant;
  }

  requireTenant(): Tenant {
    if (!this.tenant) {
      throw new TenantNotSetError();
    }
    return this.tenant;
  }
}

export const TenantContextImpl = Abstraction.createImplementation({
  implementation: TenantContextImpl,
  dependencies: []
});
```

### Step 3: Load Tenant Use Case

**File:** `packages/core/features/tenancy/LoadTenant/LoadTenantUseCase.ts`

```typescript
import { LoadTenant as Abstraction } from "../abstractions";
import { TenantsRepository } from "../shared/abstractions";
import { TenantNotFoundError } from "../errors";
import { Result } from "@webiny/feature/api";

class LoadTenantUseCase implements Abstraction.Interface {
  constructor(private repository: TenantsRepository.Interface) {}

  async execute(tenantId: string): Promise<Result<Tenant, Abstraction.Error>> {
    const result = await this.repository.get(tenantId);
    
    if (result.isFail()) {
      return Result.fail(result.error);
    }

    if (!result.value) {
      return Result.fail(new TenantNotFoundError(tenantId));
    }

    // Validate tenant is active
    if (result.value.status !== "active") {
      return Result.fail(new TenantNotActiveError(tenantId));
    }

    return Result.ok(result.value);
  }
}

export const LoadTenantUseCaseImpl = Abstraction.createImplementation({
  implementation: LoadTenantUseCase,
  dependencies: [TenantsRepository]
});
```

### Step 4: Tenant ID Extractors

**File:** `packages/core/features/tenancy/extractors/HttpTenantIdExtractor.ts`

```typescript
export class HttpTenantIdExtractor {
  extract(request: IHttpRequest): string | undefined {
    // Option 1: From header
    const headerTenant = request.headers['x-tenant'] || request.headers['X-Tenant'];
    if (headerTenant) {
      return headerTenant;
    }

    // Option 2: From subdomain
    const host = request.headers.Host || request.headers.host || "";
    const parts = host.split(".");
    
    // Example: tenant123.api.example.com -> tenant123
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== "www" && subdomain !== "api") {
        return subdomain;
      }
    }

    return undefined;
  }
}
```

### Step 5: Tenant Initializer Decorator

**File:** `packages/core/features/http/decorators/TenantInitializerDecorator.ts`

```typescript
import { HttpRouter } from "../abstractions";
import { TenantContext, LoadTenant } from "../../tenancy/abstractions";
import { HttpTenantIdExtractor } from "../../tenancy/extractors/HttpTenantIdExtractor";

class TenantInitializerDecorator implements HttpRouter.Interface {
  constructor(
    private tenantContext: TenantContext.Interface,
    private loadTenant: LoadTenant.Interface,
    private extractor: HttpTenantIdExtractor,
    private decoratee: HttpRouter.Interface
  ) {}

  async route(request: IHttpRequest): Promise<IHttpResponse> {
    // Extract tenant ID from request
    const tenantId = this.extractor.extract(request);
    
    if (!tenantId) {
      return {
        statusCode: 400,
        headers: {},
        body: { error: "Tenant ID not found in request" }
      };
    }

    // Load tenant from database
    const result = await this.loadTenant.execute(tenantId);
    
    if (result.isFail()) {
      return {
        statusCode: 404,
        headers: {},
        body: { error: `Tenant not found: ${tenantId}` }
      };
    }

    // Set tenant in context for all downstream use cases
    this.tenantContext.set(result.value);

    // Route to handler (tenant is now available)
    return this.decoratee.route(request);
  }
}

export const TenantInitializerDecoratorImpl = HttpRouter.createDecorator({
  decorator: TenantInitializerDecorator,
  dependencies: [TenantContext, LoadTenant, HttpTenantIdExtractor]
});
```

### Step 6: Updated HTTP Feature (with Tenant)

**File:** `packages/core/features/http/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { HttpRouterImpl } from "./HttpRouter";
import { SecureHeadersDecoratorImpl } from "./decorators/SecureHeadersDecorator";
import { TenantInitializerDecoratorImpl } from "./decorators/TenantInitializerDecorator";
import { GraphQLRouteImpl } from "./routes/GraphQLRoute";
import { FilesRouteImpl } from "./routes/FilesRoute";

export const HttpFeature = createFeature({
  name: "Http",
  register(container) {
    // Register router
    container.register(HttpRouterImpl).inSingletonScope();
    
    // Register decorators (order: last registered runs first)
    // Execution: SecureHeaders → TenantInitializer → HttpRouter
    container.registerDecorator(SecureHeadersDecoratorImpl);
    container.registerDecorator(TenantInitializerDecoratorImpl);
    
    // Register routes
    container.register(GraphQLRouteImpl);
    container.register(FilesRouteImpl);
  }
});
```

### Step 7: Tenancy Feature

**File:** `packages/core/features/tenancy/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { TenantContextImpl } from "./TenantContext";
import { LoadTenantUseCaseImpl } from "./LoadTenant/LoadTenantUseCase";
import { TenantsRepositoryImpl } from "./shared/TenantsRepository";
import { HttpTenantIdExtractor } from "./extractors/HttpTenantIdExtractor";

export const TenancyFeature = createFeature({
  name: "Tenancy",
  register(container) {
    // Register tenant context as singleton (per-request container)
    container.register(TenantContextImpl).inSingletonScope();
    
    // Register use case
    container.register(LoadTenantUseCaseImpl);
    
    // Register repository
    container.register(TenantsRepositoryImpl).inSingletonScope();
    
    // Register extractor
    container.registerInstance(HttpTenantIdExtractor, new HttpTenantIdExtractor());
  }
});
```

### Step 8: Tenant Error Definitions

**File:** `packages/core/features/tenancy/errors.ts`

```typescript
import { BaseError } from "@webiny/feature/api";

export class TenantNotFoundError extends BaseError<{ tenantId: string }> {
  override readonly code = "TENANT_NOT_FOUND" as const;

  constructor(tenantId: string) {
    super({
      message: `Tenant not found: ${tenantId}`,
      data: { tenantId }
    });
  }
}

export class TenantNotSetError extends BaseError {
  override readonly code = "TENANT_NOT_SET" as const;

  constructor() {
    super({
      message: "Tenant not set in context",
      data: {}
    });
  }
}

export class TenantNotActiveError extends BaseError<{ tenantId: string }> {
  override readonly code = "TENANT_NOT_ACTIVE" as const;

  constructor(tenantId: string) {
    super({
      message: `Tenant is not active: ${tenantId}`,
      data: { tenantId }
    });
  }
}

export class TenantLoadError extends BaseError {
  override readonly code = "TENANT_LOAD_ERROR" as const;

  constructor(error: Error) {
    super({
      message: `Failed to load tenant: ${error.message}`,
      data: {}
    });
  }
}
```

---

## AWS Infrastructure Adapters

### Step 1: API Gateway Event Type

**File:** `packages/aws/features/ApiGateway/ApiGatewayEventType.ts`

```typescript
import { EventType } from "@webiny/core/features/events";
import { ApiGatewayEventHandler } from "./abstractions";
import type { APIGatewayProxyEvent } from "aws-lambda";

class ApiGatewayEventType implements EventType.Interface<APIGatewayProxyEvent> {
  canHandle(event: any): event is APIGatewayProxyEvent {
    // Lightweight check - no dependencies resolved
    return !!(
      event.httpMethod &&
      event.path &&
      event.requestContext?.requestId
    );
  }

  getHandlerAbstraction() {
    return ApiGatewayEventHandler;
  }
}

export const ApiGatewayEventTypeImpl = EventType.createImplementation({
  implementation: ApiGatewayEventType,
  dependencies: []
});
```

### Step 2: API Gateway Event Handler Abstraction

**File:** `packages/aws/features/ApiGateway/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { IEventHandler, NextFunction } from "@webiny/core/features/events";

export interface IApiGatewayEventHandler 
  extends IEventHandler<APIGatewayProxyEvent, APIGatewayProxyResult> {
  handle(
    context: EventContext<APIGatewayProxyEvent>,
    next: NextFunction<APIGatewayProxyEvent, APIGatewayProxyResult>
  ): Promise<APIGatewayProxyResult>;
}

export const ApiGatewayEventHandler = createAbstraction<IApiGatewayEventHandler>(
  "ApiGatewayEventHandler"
);

export namespace ApiGatewayEventHandler {
  export type Interface = IApiGatewayEventHandler;
}
```

### Step 3: API Gateway HTTP Router Handler

**File:** `packages/aws/features/ApiGateway/handlers/HttpRouterHandler.ts`

```typescript
import { ApiGatewayEventHandler } from "../abstractions";
import { HttpRouter } from "@webiny/core/features/http/abstractions";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { EventContext, NextFunction } from "@webiny/core/features/events";

class HttpRouterHandler implements ApiGatewayEventHandler.Interface {
  constructor(private router: HttpRouter.Interface) {}

  async handle(
    context: EventContext<APIGatewayProxyEvent>,
    next: NextFunction<APIGatewayProxyEvent, APIGatewayProxyResult>
  ): Promise<APIGatewayProxyResult> {
    const event = context.event;

    // Convert to IHttpRequest
    const request: IHttpRequest = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers || {},
      query: event.queryStringParameters || {},
      body: event.body ? JSON.parse(event.body) : undefined,
      pathParameters: event.pathParameters || {}
    };

    try {
      const response = await this.router.route(request);
      
      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: JSON.stringify(response.body)
      };
    } catch (error) {
      console.error("HTTP routing error:", error);
      
      return {
        statusCode: 500,
        headers: {},
        body: JSON.stringify({ 
          error: error.message || "Internal server error" 
        })
      };
    }
  }
}

export const HttpRouterHandlerImpl = ApiGatewayEventHandler.createImplementation({
  implementation: HttpRouterHandler,
  dependencies: [HttpRouter]
});
```

### Step 4: API Gateway Feature

**File:** `packages/aws/features/ApiGateway/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { ApiGatewayEventTypeImpl } from "./ApiGatewayEventType";
import { HttpRouterHandlerImpl } from "./handlers/HttpRouterHandler";

export const ApiGatewayFeature = createFeature({
  name: "ApiGateway",
  register(container) {
    // Register event type (lightweight detection)
    container.register(ApiGatewayEventTypeImpl);

    // Register handler
    container.register(HttpRouterHandlerImpl);
  }
});
```

### Step 5: S3 Event Type

**File:** `packages/aws/features/S3/S3EventType.ts`

```typescript
import { EventType } from "@webiny/core/features/events";
import { S3EventHandler } from "./abstractions";
import type { S3Event } from "aws-lambda";

class S3EventType implements EventType.Interface<S3Event> {
  canHandle(event: any): event is S3Event {
    // Lightweight check
    return !!(
      event.Records &&
      event.Records[0]?.eventSource === "aws:s3"
    );
  }

  getHandlerAbstraction() {
    return S3EventHandler;
  }
}

export const S3EventTypeImpl = EventType.createImplementation({
  implementation: S3EventType,
  dependencies: []
});
```

### Step 6: S3 Event Handler

**File:** `packages/aws/features/S3/S3EventHandler.ts`

```typescript
import { S3EventHandler as HandlerAbstraction } from "./abstractions";
import { TenantContext, LoadTenant } from "@webiny/core/features/tenancy";
import { S3TenantIdExtractor } from "./S3TenantIdExtractor";
import { ImageProcessor } from "@webiny/core/features/media";
import type { S3Event } from "aws-lambda";
import type { EventContext, NextFunction } from "@webiny/core/features/events";

class S3EventHandler implements HandlerAbstraction.Interface {
  constructor(
    private tenantContext: TenantContext.Interface,
    private loadTenant: LoadTenant.Interface,
    private extractor: S3TenantIdExtractor,
    private imageProcessor: ImageProcessor.Interface
  ) {}

  async handle(
    context: EventContext<S3Event>,
    next: NextFunction<S3Event, void>
  ): Promise<void> {
    const event = context.event;

    // Extract tenant ID from S3 bucket name
    const tenantId = this.extractor.extract(event);
    
    if (!tenantId) {
      throw new Error("Cannot determine tenant from S3 event");
    }

    // Load tenant from database
    const result = await this.loadTenant.execute(tenantId);
    
    if (result.isFail()) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Set tenant in context
    this.tenantContext.set(result.value);

    // Process S3 event
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
      
      console.log(`Processing S3 object: ${bucket}/${key} for tenant ${tenantId}`);
      
      // Use case can now access tenant via TenantContext
      await this.imageProcessor.process(bucket, key);
    }
  }
}

export const S3EventHandlerImpl = HandlerAbstraction.createImplementation({
  implementation: S3EventHandler,
  dependencies: [TenantContext, LoadTenant, S3TenantIdExtractor, ImageProcessor]
});
```

### Step 7: S3 Tenant ID Extractor

**File:** `packages/aws/features/S3/S3TenantIdExtractor.ts`

```typescript
import type { S3Event } from "aws-lambda";

export class S3TenantIdExtractor {
  extract(event: S3Event): string | undefined {
    // Extract from bucket name pattern: "tenant123-uploads" -> "tenant123"
    const bucket = event.Records[0]?.s3.bucket.name;
    if (!bucket) {
      return undefined;
    }

    // Split on first hyphen
    const parts = bucket.split("-");
    return parts[0];
  }
}
```

### Step 8: S3 Abstractions

**File:** `packages/aws/features/S3/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { S3Event } from "aws-lambda";
import type { IEventHandler } from "@webiny/core/features/events";

export interface IS3EventHandler extends IEventHandler<S3Event, void> {}

export const S3EventHandler = createAbstraction<IS3EventHandler>("S3EventHandler");

export namespace S3EventHandler {
  export type Interface = IS3EventHandler;
}
```

### Step 9: S3 Feature

**File:** `packages/aws/features/S3/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { S3EventTypeImpl } from "./S3EventType";
import { S3EventHandlerImpl } from "./S3EventHandler";
import { S3TenantIdExtractor } from "./S3TenantIdExtractor";

export const S3Feature = createFeature({
  name: "S3",
  register(container) {
    // Register event type
    container.register(S3EventTypeImpl);

    // Register extractor
    container.registerInstance(S3TenantIdExtractor, new S3TenantIdExtractor());

    // Register handler
    container.register(S3EventHandlerImpl);
  }
});
```

### Step 10: AWS Feature (Composite)

**File:** `packages/aws/features/feature.ts`

```typescript
import { createFeature } from "@webiny/feature";
import { ApiGatewayFeature } from "./ApiGateway/feature";
import { S3Feature } from "./S3/feature";

export const AwsFeature = createFeature({
  name: "Aws",
  register(container) {
    // Register all AWS event features
    ApiGatewayFeature.register(container);
    S3Feature.register(container);
    
    // Add more AWS features as needed:
    // SqsFeature.register(container);
    // SnsFeature.register(container);
    // DynamoDBFeature.register(container);
  }
});
```

---

## Lambda Handler Setup

### Step 1: Lambda Entry Point

**File:** `packages/aws/handler.ts`

```typescript
import { Container } from "@webiny/di";
import { EventsFeature } from "@webiny/core/features/events";
import { TenancyFeature } from "@webiny/core/features/tenancy";
import { HttpFeature } from "@webiny/core/features/http";
import { AwsFeature } from "./features/feature";
import { EventDispatcher } from "@webiny/core/features/events";

// Create base container with all features registered
const baseContainer = new Container();

// Register core features (cloud-agnostic)
EventsFeature.register(baseContainer);
TenancyFeature.register(baseContainer);
HttpFeature.register(baseContainer);

// Register AWS-specific features
AwsFeature.register(baseContainer);

// Lambda handler factory
export const createHandler = () => {
  return async (event: any) => {
    // Create child container for this request (isolates TenantContext)
    const requestContainer = baseContainer.createChildContainer();
    
    // Resolve dispatcher for this request
    const dispatcher = requestContainer.resolve(EventDispatcher);
    
    // Dispatch event (will auto-detect type and route)
    return dispatcher.dispatch(event);
  };
};

// Export the handler
export const handler = createHandler();
```

### Step 2: Example with Application Features

**File:** `packages/aws/handler-with-app.ts`

```typescript
import { Container } from "@webiny/di";
import { EventsFeature } from "@webiny/core/features/events";
import { TenancyFeature } from "@webiny/core/features/tenancy";
import { HttpFeature } from "@webiny/core/features/http";
import { GraphQLFeature } from "@webiny/core/features/graphql";
import { CmsFeature } from "@webiny/core/features/cms";
import { MediaFeature } from "@webiny/core/features/media";
import { AwsFeature } from "./features/feature";
import { EventDispatcher } from "@webiny/core/features/events";

const baseContainer = new Container();

// Register core infrastructure features
EventsFeature.register(baseContainer);
TenancyFeature.register(baseContainer);
HttpFeature.register(baseContainer);

// Register application features
GraphQLFeature.register(baseContainer);
CmsFeature.register(baseContainer);
MediaFeature.register(baseContainer);

// Register cloud-specific features
AwsFeature.register(baseContainer);

export const handler = async (event: any) => {
  const requestContainer = baseContainer.createChildContainer();
  const dispatcher = requestContainer.resolve(EventDispatcher);
  return dispatcher.dispatch(event);
};
```

---

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1)

**Tasks:**
1. Create package structure (`packages/core`, `packages/aws`)
2. Implement core event system
   - `EventDispatcher`
   - `EventType`
   - `EventHandler`
3. Create base features
4. Write unit tests for event dispatcher

**Success Criteria:**
- Event dispatcher can match events to handlers
- Middleware chain executes in correct order
- Tests pass

### Phase 2: HTTP System (Week 2)

**Tasks:**
1. Implement HTTP abstractions
2. Create `HttpRouter`
3. Build decorators (SecureHeaders, TenantInitializer)
4. Create example routes (GraphQL, Files)
5. Write integration tests

**Success Criteria:**
- Routes can be registered and matched
- Decorators wrap router correctly
- OPTIONS requests handled properly

### Phase 3: Tenant Context (Week 3)

**Tasks:**
1. Implement `TenantContext`
2. Create `LoadTenant` use case
3. Build tenant ID extractors
4. Integrate with HTTP router
5. Test tenant isolation

**Success Criteria:**
- Tenant loaded from request
- Use cases can access tenant context
- Per-request isolation works

### Phase 4: AWS Adapters (Week 4)

**Tasks:**
1. Create API Gateway adapter
2. Create S3 event handler
3. Build tenant extractors for each event type
4. Test with real AWS events
5. Add SQS, SNS handlers as needed

**Success Criteria:**
- API Gateway events route to HTTP system
- S3 events processed with tenant context
- All AWS event types supported

### Phase 5: Migration & Cleanup (Week 5-6)

**Tasks:**
1. Migrate existing routes to new system
2. Remove old fastify-based infrastructure
3. Update tests
4. Performance testing
5. Documentation

**Success Criteria:**
- All routes migrated
- Old code removed
- Performance acceptable
- Documentation complete

---

## Testing Strategy

### Unit Tests

**Event Dispatcher:**
```typescript
describe("EventDispatcher", () => {
  it("should match event to correct handler", async () => {
    // Test event type detection
  });

  it("should execute middleware chain in correct order", async () => {
    // Test middleware execution
  });

  it("should throw when no handler found", async () => {
    // Test error handling
  });
});
```

**HTTP Router:**
```typescript
describe("HttpRouter", () => {
  it("should match exact path", async () => {
    // Test exact matching
  });

  it("should match wildcard path", async () => {
    // Test wildcard matching
  });

  it("should throw when route not found", async () => {
    // Test 404 handling
  });
});
```

**Tenant Context:**
```typescript
describe("TenantContext", () => {
  it("should set and get tenant", () => {
    // Test basic operations
  });

  it("should throw when tenant not set", () => {
    // Test requireTenant()
  });

  it("should prevent setting tenant twice", () => {
    // Test immutability
  });
});
```

### Integration Tests

**HTTP Flow:**
```typescript
describe("HTTP Request Flow", () => {
  it("should process full request with decorators", async () => {
    const container = new Container();
    HttpFeature.register(container);
    TenancyFeature.register(container);
    
    const dispatcher = container.resolve(EventDispatcher);
    
    const event = createMockApiGatewayEvent({
      method: "POST",
      path: "/graphql",
      headers: { "x-tenant": "test-tenant" }
    });
    
    const result = await dispatcher.dispatch(event);
    
    expect(result.statusCode).toBe(200);
  });
});
```

**Tenant Isolation:**
```typescript
describe("Tenant Isolation", () => {
  it("should isolate tenants across requests", async () => {
    const baseContainer = new Container();
    HttpFeature.register(baseContainer);
    
    // Request 1
    const container1 = baseContainer.createChildContainer();
    const context1 = container1.resolve(TenantContext);
    context1.set({ id: "tenant-1", ... });
    
    // Request 2
    const container2 = baseContainer.createChildContainer();
    const context2 = container2.resolve(TenantContext);
    
    expect(context2.get()).toBeUndefined();
  });
});
```

### Performance Tests

```typescript
describe("Performance", () => {
  it("should handle 1000 requests/second", async () => {
    // Load test
  });

  it("should resolve dependencies in <10ms", async () => {
    // DI performance test
  });
});
```

---

## Example Use Case

### Creating a Page (with Tenant Context)

**File:** `packages/core/features/cms/CreatePage/CreatePageUseCase.ts`

```typescript
import { CreatePage } from "./abstractions";
import { TenantContext } from "../../tenancy/abstractions";
import { PagesRepository } from "../shared/abstractions";
import { EventPublisher } from "../../events/abstractions";
import { PageCreatedEvent } from "./events";
import { Result } from "@webiny/feature/api";

class CreatePageUseCase implements CreatePage.Interface {
  constructor(
    private tenantContext: TenantContext.Interface,
    private repository: PagesRepository.Interface,
    private eventPublisher: EventPublisher.Interface
  ) {}

  async execute(input: CreatePageInput): Promise<Result<Page, CreatePage.Error>> {
    // Get tenant - available because decorator initialized it
    const tenant = this.tenantContext.requireTenant();
    
    const page = {
      id: generateId(),
      tenantId: tenant.id, // Use for data isolation
      title: input.title,
      content: input.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.repository.create(page);
    
    if (result.isFail()) {
      return Result.fail(result.error);
    }

    // Publish domain event
    await this.eventPublisher.publish(
      new PageCreatedEvent({ page: result.value })
    );

    return Result.ok(result.value);
  }
}

export const CreatePageUseCaseImpl = CreatePage.createImplementation({
  implementation: CreatePageUseCase,
  dependencies: [TenantContext, PagesRepository, EventPublisher]
});
```

---

## Key Benefits Summary

1. ✅ **Cloud Agnostic** - HTTP routes work on AWS, Azure, GCP
2. ✅ **Performance** - Event type detection is lightweight
3. ✅ **Middleware** - Chain handlers with `next()`
4. ✅ **Tenant Isolation** - Per-request containers
5. ✅ **Type Safe** - Full TypeScript support
6. ✅ **Testable** - Easy to mock and test
7. ✅ **Scalable** - Add new event types easily
8. ✅ **Clean** - Clear separation of concerns
9. ✅ **DI-Based** - Everything injected, nothing global
10. ✅ **Decorator Pattern** - Cross-cutting concerns handled cleanly

---

## Next Steps

1. Review this plan with the team
2. Set up package structure
3. Implement Phase 1 (Event System)
4. Write tests for each component
5. Iterate and refine based on real usage

---

## Questions to Consider

1. **Error Handling**: How should we handle errors in middleware chain?
2. **Logging**: Should we have a logging decorator?
3. **Metrics**: How to track performance?
4. **Rate Limiting**: Decorator or separate concern?
5. **Caching**: Where does caching fit?
6. **Validation**: Request validation decorator?

---

*This is a living document. Update as the implementation evolves.*
