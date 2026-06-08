// Quick test to verify exports work correctly
import {
  // Core
  createFunction,
  Container,
  Abstraction,

  // Handlers
  ApiGatewayEventHandler,
  DynamoDBEventHandler,
  EventBridgeEventHandler,
  RawEventHandler,
  S3EventHandler,
  SnsEventHandler,
  SqsEventHandler,

  // Qualifiers
  ApiGatewayEventQualifier,
  DynamoDBEventQualifier,
  EventBridgeEventQualifier,
  S3EventQualifier,
  SnsEventQualifier,
  SqsEventQualifier,

  // Qualifier implementations
  apiGatewayEventQualifier,
  dynamoDBEventQualifier,
  eventBridgeEventQualifier,
  s3EventQualifier,
  snsEventQualifier,
  sqsEventQualifier,

  // Core AWS Lambda
  AwsLambdaContext,
  AwsLambdaEvent
} from "./src/index.js";

console.log("✅ All imports successful!");
console.log("✅ Handlers:", {
  ApiGatewayEventHandler,
  DynamoDBEventHandler,
  EventBridgeEventHandler,
  RawEventHandler,
  S3EventHandler,
  SnsEventHandler,
  SqsEventHandler
});
console.log("✅ Qualifiers:", {
  ApiGatewayEventQualifier,
  DynamoDBEventQualifier,
  EventBridgeEventQualifier,
  S3EventQualifier,
  SnsEventQualifier,
  SqsEventQualifier
});
console.log("✅ AWS Lambda:", { AwsLambdaContext, AwsLambdaEvent });
