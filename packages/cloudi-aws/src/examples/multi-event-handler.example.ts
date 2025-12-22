/**
 * Complete Example: Multi-Event Handler
 *
 * This example demonstrates the middleware pattern with a single Lambda function
 * that handles multiple AWS event types:
 * - API Gateway (HTTP requests)
 * - SNS (topic messages)
 * - S3 (bucket events)
 *
 * Deploy this as a single Lambda with multiple triggers!
 */

import { createImplementation, Abstraction } from "@webiny/di";
import {
    createFunction,
    ApiGatewayFunction,
    SnsFunction,
    S3Function,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type SNSEvent,
    type SnsResult,
    type S3Event,
    type S3Result,
    type NextFunction
} from "../index.js";

// ============================================================================
// Service Abstractions (you'd define these in your abstractions folder)
// ============================================================================


interface ILogger {
    info(message: string, meta?: any): void;
    error(message: string, error?: any): void;
}

interface IUserService {
    listUsers(): Promise<Array<{ id: string; name: string; email: string }>>;
}

interface INotificationService {
    sendNotification(userId: string, message: string): Promise<void>;
}

interface IFileProcessor {
    processFile(bucket: string, key: string): Promise<void>;
}

const Logger = new Abstraction<ILogger>("Logger");
const UserService = new Abstraction<IUserService>("UserService");
const NotificationService = new Abstraction<INotificationService>("NotificationService");
const FileProcessor = new Abstraction<IFileProcessor>("FileProcessor");

// ============================================================================
// Handler 1: List Users (API Gateway)
// ============================================================================

class ListUsersHandler implements ApiGatewayFunction.Interface {
    constructor(
        private userService: IUserService,
        private logger: ILogger
    ) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        // Middleware check: Is this an API Gateway event?
        if (!event.httpMethod) {
            this.logger.info("Not an API Gateway event, calling next()");
            return next();
        }

        // Additional routing: Only handle GET /users
        if (event.httpMethod !== "GET" || event.path !== "/users") {
            this.logger.info(`Not matching route: ${event.httpMethod} ${event.path}, calling next()`);
            return next();
        }

        this.logger.info("Handling GET /users request");

        try {
            const users = await this.userService.listUsers();

            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    success: true,
                    data: users,
                    count: users.length
                })
            };
        } catch (error) {
            this.logger.error("Failed to list users", error);

            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    error: "Failed to retrieve users"
                })
            };
        }
    }
}

const listUsersHandler = createImplementation({
    abstraction: ApiGatewayFunction,
    implementation: ListUsersHandler,
    dependencies: [UserService, Logger]
});

// ============================================================================
// Handler 2: User Notification (SNS)
// ============================================================================

class UserNotificationHandler implements SnsFunction.Interface {
    constructor(
        private notificationService: INotificationService,
        private logger: ILogger
    ) {}

    async execute(event: SNSEvent, next: NextFunction): Promise<SnsResult> {
        // Middleware check: Is this an SNS event?
        if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
            this.logger.info("Not an SNS event, calling next()");
            return next();
        }

        this.logger.info("Handling SNS notification event", {
            recordCount: event.Records.length
        });

        let processedCount = 0;

        try {
            for (const record of event.Records) {
                const message = JSON.parse(record.Sns.Message);

                this.logger.info("Processing notification", {
                    userId: message.userId,
                    messageId: record.Sns.MessageId
                });

                await this.notificationService.sendNotification(
                    message.userId,
                    message.text
                );

                processedCount++;
            }

            return {
                success: true,
                processedRecords: processedCount,
                message: `Sent ${processedCount} notifications`
            };
        } catch (error) {
            this.logger.error("Failed to process SNS event", error);

            return {
                success: false,
                processedRecords: processedCount,
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
}

const userNotificationHandler = createImplementation({
    abstraction: SnsFunction,
    implementation: UserNotificationHandler,
    dependencies: [NotificationService, Logger]
});

// ============================================================================
// Handler 3: File Upload (S3)
// ============================================================================

class FileUploadHandler implements S3Function.Interface {
    constructor(
        private fileProcessor: IFileProcessor,
        private logger: ILogger
    ) {}

    async execute(event: S3Event, next: NextFunction): Promise<S3Result> {
        // Middleware check: Is this an S3 event?
        if (!Array.isArray(event.Records) || event.Records[0]?.eventSource !== "aws:s3") {
            this.logger.info("Not an S3 event, calling next()");
            return next();
        }

        this.logger.info("Handling S3 file upload event", {
            recordCount: event.Records.length
        });

        let processedCount = 0;

        try {
            for (const record of event.Records) {
                const bucket = record.s3.bucket.name;
                const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

                this.logger.info("Processing file", {
                    bucket,
                    key,
                    eventName: record.eventName
                });

                await this.fileProcessor.processFile(bucket, key);
                processedCount++;
            }

            return {
                success: true,
                processedRecords: processedCount,
                message: `Processed ${processedCount} files`
            };
        } catch (error) {
            this.logger.error("Failed to process S3 event", error);

            return {
                success: false,
                processedRecords: processedCount,
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
}

const fileUploadHandler = createImplementation({
    abstraction: S3Function,
    implementation: FileUploadHandler,
    dependencies: [FileProcessor, Logger]
});

// ============================================================================
// Service Implementations (simplified for example)
// ============================================================================

class ConsoleLogger implements ILogger {
    info(message: string, meta?: any): void {
        console.log(`[INFO] ${message}`, meta || "");
    }

    error(message: string, error?: any): void {
        console.error(`[ERROR] ${message}`, error || "");
    }
}

const consoleLogger = createImplementation({
    abstraction: Logger,
    implementation: ConsoleLogger,
    dependencies: []
});

class MockUserService implements IUserService {
    async listUsers() {
        return [
            { id: "1", name: "Alice", email: "alice@example.com" },
            { id: "2", name: "Bob", email: "bob@example.com" }
        ];
    }
}

const mockUserService = createImplementation({
    abstraction: UserService,
    implementation: MockUserService,
    dependencies: []
});

class MockNotificationService implements INotificationService {
    constructor(private logger: ILogger) {}

    async sendNotification(userId: string, message: string): Promise<void> {
        this.logger.info(`Sending notification to user ${userId}: ${message}`);
        // In real implementation, send email/SMS/push notification
    }
}

const mockNotificationService = createImplementation({
    abstraction: NotificationService,
    implementation: MockNotificationService,
    dependencies: [Logger]
});

class MockFileProcessor implements IFileProcessor {
    constructor(private logger: ILogger) {}

    async processFile(bucket: string, key: string): Promise<void> {
        this.logger.info(`Processing file: s3://${bucket}/${key}`);
        // In real implementation, process the file (resize image, scan virus, etc.)
    }
}

const mockFileProcessor = createImplementation({
    abstraction: FileProcessor,
    implementation: MockFileProcessor,
    dependencies: [Logger]
});

// ============================================================================
// Lambda Handler - Composition Root
// ============================================================================

/**
 * Single Lambda handler that can process:
 * - API Gateway events (GET /users)
 * - SNS events (user notifications)
 * - S3 events (file uploads)
 *
 * The middleware pattern automatically routes each event to the correct handler!
 */
export const handler = createFunction((container) => {
    // Register services
    container.register(consoleLogger).inSingletonScope();
    container.register(mockUserService).inSingletonScope();
    container.register(mockNotificationService).inSingletonScope();
    container.register(mockFileProcessor).inSingletonScope();

    // Register function handlers
    // Order matters! Handlers are called in registration order.
    // Each handler checks if it can process the event, and calls next() if not.
    container.register(listUsersHandler).inSingletonScope();         // First: Check for API GW
    container.register(userNotificationHandler).inSingletonScope();  // Second: Check for SNS
    container.register(fileUploadHandler).inSingletonScope();        // Third: Check for S3
});

// ============================================================================
// Example Infrastructure Setup (Pulumi/Terraform pseudo-code)
// ============================================================================

/**
 * Deploy the Lambda with multiple triggers:
 *
 * ```typescript
 * // 1. Create the Lambda function
 * const multiEventLambda = new aws.lambda.Function("multi-event-handler", {
 *     runtime: "nodejs20.x",
 *     handler: "multi-event-handler.handler",
 *     code: new pulumi.asset.FileArchive("./dist"),
 *     timeout: 30,
 *     memorySize: 512
 * });
 *
 * // 2. Attach API Gateway trigger (for GET /users)
 * const api = new aws.apigatewayv2.Api("http-api", {
 *     protocolType: "HTTP"
 * });
 *
 * new aws.apigatewayv2.Integration("users-integration", {
 *     apiId: api.id,
 *     integrationType: "AWS_PROXY",
 *     integrationUri: multiEventLambda.arn,
 *     integrationMethod: "POST",
 *     payloadFormatVersion: "2.0"
 * });
 *
 * new aws.apigatewayv2.Route("users-route", {
 *     apiId: api.id,
 *     routeKey: "GET /users",
 *     target: pulumi.interpolate`integrations/${integration.id}`
 * });
 *
 * // 3. Attach SNS trigger (for notifications)
 * const notificationTopic = new aws.sns.Topic("user-notifications");
 *
 * new aws.sns.TopicSubscription("lambda-subscription", {
 *     topic: notificationTopic.arn,
 *     protocol: "lambda",
 *     endpoint: multiEventLambda.arn
 * });
 *
 * // 4. Attach S3 trigger (for file uploads)
 * const uploadBucket = new aws.s3.Bucket("file-uploads");
 *
 * new aws.s3.BucketNotification("upload-notification", {
 *     bucket: uploadBucket.id,
 *     lambdaFunctions: [{
 *         lambdaFunctionArn: multiEventLambda.arn,
 *         events: ["s3:ObjectCreated:*"]
 *     }]
 * });
 * ```
 *
 * Result: One Lambda function handles ALL three event types!
 */

