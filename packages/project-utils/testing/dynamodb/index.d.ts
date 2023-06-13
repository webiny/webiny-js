import { DocumentClient } from "aws-sdk/clients/dynamodb";

export function getDocumentClient(): DocumentClient;
export function simulateStream(documentClient: DocumentClient, handler: any): void;
