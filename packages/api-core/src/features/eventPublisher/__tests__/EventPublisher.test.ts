import { describe, it, expect, beforeEach } from "vitest";
import { Container, Abstraction, createImplementation } from "@webiny/di-container";
import { EventPublisherFeature } from "../feature.js";
import { EventPublisher as EventPublisherAbstraction } from "../abstractions.js";
import type { DomainEvent, IEventHandler } from "../abstractions.js";

// ============================================================================
// Test Event: PagePublished
// ============================================================================

interface PagePublishedPayload {
    pageId: string;
    title: string;
    publishedBy: string;
    publishedAt: Date;
}

class PagePublishedEvent implements DomainEvent<PagePublishedPayload> {
    eventType = "page.published" as const;
    occurredAt: Date;

    constructor(public payload: PagePublishedPayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return PagePublishedHandler;
    }
}

export const PagePublishedHandler = new Abstraction<IEventHandler<PagePublishedEvent>>(
    "PagePublishedHandler"
);

// ============================================================================
// Test Event: UserRegistered
// ============================================================================

interface UserRegisteredPayload {
    userId: string;
    email: string;
    name: string;
}

class UserRegisteredEvent implements DomainEvent<UserRegisteredPayload> {
    eventType = "user.registered" as const;
    occurredAt: Date;

    constructor(public payload: UserRegisteredPayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return UserRegisteredHandler;
    }
}

export const UserRegisteredHandler = new Abstraction<IEventHandler<UserRegisteredEvent>>(
    "UserRegisteredHandler"
);

// ============================================================================
// Test Event: OrderPlaced
// ============================================================================

interface OrderPlacedPayload {
    orderId: string;
    customerId: string;
    total: number;
    items: Array<{ productId: string; quantity: number }>;
}

class OrderPlacedEvent implements DomainEvent<OrderPlacedPayload> {
    eventType = "order.placed" as const;
    occurredAt: Date;

    constructor(public payload: OrderPlacedPayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return OrderPlacedHandler;
    }
}

export const OrderPlacedHandler = new Abstraction<IEventHandler<OrderPlacedEvent>>(
    "OrderPlacedHandler"
);

// ============================================================================
// Handler Implementations for PagePublished
// ============================================================================

class SendNotificationHandler implements IEventHandler<PagePublishedEvent> {
    public handledEvents: PagePublishedEvent[] = [];

    async handle(event: PagePublishedEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`📧 Sending notification for page: ${event.payload.title}`);
    }
}

export const SendNotificationHandlerImpl = createImplementation({
    abstraction: PagePublishedHandler,
    implementation: SendNotificationHandler,
    dependencies: []
});

class UpdateSearchIndexHandler implements IEventHandler<PagePublishedEvent> {
    public handledEvents: PagePublishedEvent[] = [];

    async handle(event: PagePublishedEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`🔍 Updating search index for page: ${event.payload.pageId}`);
    }
}

export const UpdateSearchIndexHandlerImpl = createImplementation({
    abstraction: PagePublishedHandler,
    implementation: UpdateSearchIndexHandler,
    dependencies: []
});

class LogPagePublishedHandler implements IEventHandler<PagePublishedEvent> {
    public handledEvents: PagePublishedEvent[] = [];

    async handle(event: PagePublishedEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(
            `📝 Logging: Page ${event.payload.pageId} published by ${event.payload.publishedBy}`
        );
    }
}

export const LogPagePublishedHandlerImpl = createImplementation({
    abstraction: PagePublishedHandler,
    implementation: LogPagePublishedHandler,
    dependencies: []
});

// ============================================================================
// Handler Implementations for UserRegistered
// ============================================================================

class SendWelcomeEmailHandler implements IEventHandler<UserRegisteredEvent> {
    public handledEvents: UserRegisteredEvent[] = [];

    async handle(event: UserRegisteredEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`👋 Sending welcome email to: ${event.payload.email}`);
    }
}

export const SendWelcomeEmailHandlerImpl = createImplementation({
    abstraction: UserRegisteredHandler,
    implementation: SendWelcomeEmailHandler,
    dependencies: []
});

class CreateUserProfileHandler implements IEventHandler<UserRegisteredEvent> {
    public handledEvents: UserRegisteredEvent[] = [];

    async handle(event: UserRegisteredEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`👤 Creating profile for user: ${event.payload.userId}`);
    }
}

export const CreateUserProfileHandlerImpl = createImplementation({
    abstraction: UserRegisteredHandler,
    implementation: CreateUserProfileHandler,
    dependencies: []
});

class TrackUserRegistrationHandler implements IEventHandler<UserRegisteredEvent> {
    public handledEvents: UserRegisteredEvent[] = [];

    async handle(event: UserRegisteredEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`📊 Tracking registration analytics for: ${event.payload.userId}`);
    }
}

export const TrackUserRegistrationHandlerImpl = createImplementation({
    abstraction: UserRegisteredHandler,
    implementation: TrackUserRegistrationHandler,
    dependencies: []
});

// ============================================================================
// Handler Implementations for OrderPlaced
// ============================================================================

class ProcessPaymentHandler implements IEventHandler<OrderPlacedEvent> {
    public handledEvents: OrderPlacedEvent[] = [];

    async handle(event: OrderPlacedEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`💳 Processing payment for order: ${event.payload.orderId}`);
    }
}

export const ProcessPaymentHandlerImpl = createImplementation({
    abstraction: OrderPlacedHandler,
    implementation: ProcessPaymentHandler,
    dependencies: []
});

class SendOrderConfirmationHandler implements IEventHandler<OrderPlacedEvent> {
    public handledEvents: OrderPlacedEvent[] = [];

    async handle(event: OrderPlacedEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`📧 Sending order confirmation for: ${event.payload.orderId}`);
    }
}

export const SendOrderConfirmationHandlerImpl = createImplementation({
    abstraction: OrderPlacedHandler,
    implementation: SendOrderConfirmationHandler,
    dependencies: []
});

class UpdateInventoryHandler implements IEventHandler<OrderPlacedEvent> {
    public handledEvents: OrderPlacedEvent[] = [];

    async handle(event: OrderPlacedEvent): Promise<void> {
        this.handledEvents.push(event);
        console.log(`📦 Updating inventory for ${event.payload.items.length} items`);
    }
}

export const UpdateInventoryHandlerImpl = createImplementation({
    abstraction: OrderPlacedHandler,
    implementation: UpdateInventoryHandler,
    dependencies: []
});

// ============================================================================
// Tests
// ============================================================================

describe("EventPublisher", () => {
    let container: Container;
    let publisher: EventPublisherAbstraction.Interface;

    beforeEach(() => {
        container = new Container();

        // ✅ Register EventPublisher using the feature
        EventPublisherFeature.register(container);

        publisher = container.resolve(EventPublisherAbstraction);
    });

    describe("PagePublished Event", () => {
        it("should execute all registered PagePublished handlers", async () => {
            // Register handlers
            container.register(SendNotificationHandlerImpl).inSingletonScope();
            container.register(UpdateSearchIndexHandlerImpl).inSingletonScope();
            container.register(LogPagePublishedHandlerImpl).inSingletonScope();

            // Create and publish event
            const event = new PagePublishedEvent({
                pageId: "page-123",
                title: "Getting Started with TypeScript",
                publishedBy: "user-456",
                publishedAt: new Date()
            });

            await publisher.publish(event);

            // Verify all handlers were called
            const handlers = container.resolveAll(PagePublishedHandler);
            expect(handlers).toHaveLength(3);

            expect((handlers[0] as SendNotificationHandler).handledEvents).toHaveLength(1);
            expect((handlers[1] as UpdateSearchIndexHandler).handledEvents).toHaveLength(1);
            expect((handlers[2] as LogPagePublishedHandler).handledEvents).toHaveLength(1);
        });

        it("should pass correct event data to handlers", async () => {
            container.register(SendNotificationHandlerImpl).inSingletonScope();

            const eventData = {
                pageId: "page-789",
                title: "Advanced Patterns",
                publishedBy: "admin-001",
                publishedAt: new Date("2024-01-15")
            };

            const event = new PagePublishedEvent(eventData);
            await publisher.publish(event);

            const handler = container.resolve(PagePublishedHandler) as SendNotificationHandler;
            const handledEvent = handler.handledEvents[0];

            expect(handledEvent.payload.pageId).toBe(eventData.pageId);
            expect(handledEvent.payload.title).toBe(eventData.title);
            expect(handledEvent.payload.publishedBy).toBe(eventData.publishedBy);
            expect(handledEvent.eventType).toBe("page.published");
        });

        it("should handle multiple events sequentially", async () => {
            container.register(LogPagePublishedHandlerImpl).inSingletonScope();

            const event1 = new PagePublishedEvent({
                pageId: "page-1",
                title: "First Page",
                publishedBy: "user-1",
                publishedAt: new Date()
            });

            const event2 = new PagePublishedEvent({
                pageId: "page-2",
                title: "Second Page",
                publishedBy: "user-2",
                publishedAt: new Date()
            });

            await publisher.publish(event1);
            await publisher.publish(event2);

            const handler = container.resolve(PagePublishedHandler) as LogPagePublishedHandler;
            expect(handler.handledEvents).toHaveLength(2);
            expect(handler.handledEvents[0].payload.pageId).toBe("page-1");
            expect(handler.handledEvents[1].payload.pageId).toBe("page-2");
        });

        it("should work with no handlers registered", async () => {
            const event = new PagePublishedEvent({
                pageId: "page-999",
                title: "Orphan Page",
                publishedBy: "user-999",
                publishedAt: new Date()
            });

            // Should not throw
            await expect(publisher.publish(event)).resolves.not.toThrow();
        });
    });

    describe("UserRegistered Event", () => {
        it("should execute all registered UserRegistered handlers", async () => {
            container.register(SendWelcomeEmailHandlerImpl).inSingletonScope();
            container.register(CreateUserProfileHandlerImpl).inSingletonScope();
            container.register(TrackUserRegistrationHandlerImpl).inSingletonScope();

            const event = new UserRegisteredEvent({
                userId: "user-123",
                email: "john@example.com",
                name: "John Doe"
            });

            await publisher.publish(event);

            const handlers = container.resolveAll(UserRegisteredHandler);
            expect(handlers).toHaveLength(3);

            expect((handlers[0] as SendWelcomeEmailHandler).handledEvents).toHaveLength(1);
            expect((handlers[1] as CreateUserProfileHandler).handledEvents).toHaveLength(1);
            expect((handlers[2] as TrackUserRegistrationHandler).handledEvents).toHaveLength(1);
        });

        it("should pass correct user data to handlers", async () => {
            container.register(CreateUserProfileHandlerImpl).inSingletonScope();

            const event = new UserRegisteredEvent({
                userId: "user-456",
                email: "jane@example.com",
                name: "Jane Smith"
            });

            await publisher.publish(event);

            const handler = container.resolve(UserRegisteredHandler) as CreateUserProfileHandler;
            const handledEvent = handler.handledEvents[0];

            expect(handledEvent.payload.userId).toBe("user-456");
            expect(handledEvent.payload.email).toBe("jane@example.com");
            expect(handledEvent.payload.name).toBe("Jane Smith");
            expect(handledEvent.eventType).toBe("user.registered");
        });
    });

    describe("OrderPlaced Event", () => {
        it("should execute all registered OrderPlaced handlers", async () => {
            container.register(ProcessPaymentHandlerImpl).inSingletonScope();
            container.register(SendOrderConfirmationHandlerImpl).inSingletonScope();
            container.register(UpdateInventoryHandlerImpl).inSingletonScope();

            const event = new OrderPlacedEvent({
                orderId: "order-123",
                customerId: "customer-456",
                total: 99.99,
                items: [
                    { productId: "prod-1", quantity: 2 },
                    { productId: "prod-2", quantity: 1 }
                ]
            });

            await publisher.publish(event);

            const handlers = container.resolveAll(OrderPlacedHandler);
            expect(handlers).toHaveLength(3);

            expect((handlers[0] as ProcessPaymentHandler).handledEvents).toHaveLength(1);
            expect((handlers[1] as SendOrderConfirmationHandler).handledEvents).toHaveLength(1);
            expect((handlers[2] as UpdateInventoryHandler).handledEvents).toHaveLength(1);
        });

        it("should pass correct order data to handlers", async () => {
            container.register(UpdateInventoryHandlerImpl).inSingletonScope();

            const orderData = {
                orderId: "order-789",
                customerId: "customer-123",
                total: 249.99,
                items: [
                    { productId: "prod-10", quantity: 1 },
                    { productId: "prod-20", quantity: 3 }
                ]
            };

            const event = new OrderPlacedEvent(orderData);
            await publisher.publish(event);

            const handler = container.resolve(OrderPlacedHandler) as UpdateInventoryHandler;
            const handledEvent = handler.handledEvents[0];

            expect(handledEvent.payload.orderId).toBe(orderData.orderId);
            expect(handledEvent.payload.total).toBe(orderData.total);
            expect(handledEvent.payload.items).toHaveLength(2);
            expect(handledEvent.eventType).toBe("order.placed");
        });
    });

    describe("Mixed Events", () => {
        it("should handle different event types independently", async () => {
            // Register handlers for different events
            container.register(SendNotificationHandlerImpl).inSingletonScope();
            container.register(SendWelcomeEmailHandlerImpl).inSingletonScope();
            container.register(ProcessPaymentHandlerImpl).inSingletonScope();

            // Publish different events
            const pageEvent = new PagePublishedEvent({
                pageId: "page-1",
                title: "Test Page",
                publishedBy: "user-1",
                publishedAt: new Date()
            });

            const userEvent = new UserRegisteredEvent({
                userId: "user-2",
                email: "test@example.com",
                name: "Test User"
            });

            const orderEvent = new OrderPlacedEvent({
                orderId: "order-1",
                customerId: "customer-1",
                total: 50.0,
                items: [{ productId: "prod-1", quantity: 1 }]
            });

            await publisher.publish(pageEvent);
            await publisher.publish(userEvent);
            await publisher.publish(orderEvent);

            // Verify each handler only received its event type
            const pageHandlers = container.resolveAll(PagePublishedHandler);
            const userHandlers = container.resolveAll(UserRegisteredHandler);
            const orderHandlers = container.resolveAll(OrderPlacedHandler);

            expect((pageHandlers[0] as SendNotificationHandler).handledEvents).toHaveLength(1);
            expect((userHandlers[0] as SendWelcomeEmailHandler).handledEvents).toHaveLength(1);
            expect((orderHandlers[0] as ProcessPaymentHandler).handledEvents).toHaveLength(1);
        });

        it("should maintain event isolation between types", async () => {
            container.register(SendNotificationHandlerImpl).inSingletonScope();
            container.register(SendWelcomeEmailHandlerImpl).inSingletonScope();

            const pageEvent = new PagePublishedEvent({
                pageId: "page-1",
                title: "Test",
                publishedBy: "user-1",
                publishedAt: new Date()
            });

            const userEvent = new UserRegisteredEvent({
                userId: "user-1",
                email: "test@test.com",
                name: "Test"
            });

            await publisher.publish(pageEvent);
            await publisher.publish(userEvent);

            const pageHandler = container.resolve(PagePublishedHandler) as SendNotificationHandler;
            const userHandler = container.resolve(UserRegisteredHandler) as SendWelcomeEmailHandler;

            // Page handler should only have page events
            expect(pageHandler.handledEvents).toHaveLength(1);
            expect(pageHandler.handledEvents[0].eventType).toBe("page.published");

            // User handler should only have user events
            expect(userHandler.handledEvents).toHaveLength(1);
            expect(userHandler.handledEvents[0].eventType).toBe("user.registered");
        });
    });

    describe("Error Handling", () => {
        it("should handle handler errors gracefully", async () => {
            class FailingHandler implements IEventHandler<PagePublishedEvent> {
                async handle(event: PagePublishedEvent): Promise<void> {
                    throw new Error("Handler failed!");
                }
            }

            const FailingHandlerImpl = createImplementation({
                abstraction: PagePublishedHandler,
                implementation: FailingHandler,
                dependencies: []
            });

            container.register(FailingHandlerImpl);

            const event = new PagePublishedEvent({
                pageId: "page-1",
                title: "Test",
                publishedBy: "user-1",
                publishedAt: new Date()
            });

            // Should throw the handler error
            await expect(publisher.publish(event)).rejects.toThrow("Handler failed!");
        });
    });

    describe("Handler Registration", () => {
        it("should support dynamic handler registration", async () => {
            const event = new PagePublishedEvent({
                pageId: "page-1",
                title: "Test",
                publishedBy: "user-1",
                publishedAt: new Date()
            });

            // No handlers yet
            await publisher.publish(event);

            let handlers = container.resolveAll(PagePublishedHandler);
            expect(handlers).toHaveLength(0);

            // Register handler
            container.register(SendNotificationHandlerImpl).inSingletonScope();

            // Now handler should execute
            await publisher.publish(event);

            handlers = container.resolveAll(PagePublishedHandler);
            expect(handlers).toHaveLength(1);
            expect((handlers[0] as SendNotificationHandler).handledEvents).toHaveLength(1);
        });
    });
});
