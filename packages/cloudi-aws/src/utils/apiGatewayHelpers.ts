import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";

/**
 * Helper utilities for API Gateway responses
 */
export const apiGatewayHelpers = {
    /**
     * Create a successful JSON response
     */
    success(body: any, statusCode: number = 200): APIGatewayProxyResult {
        return {
            statusCode,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        };
    },

    /**
     * Create an error response
     */
    error(message: string, statusCode: number = 500): APIGatewayProxyResult {
        return {
            statusCode,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: message })
        };
    }
};

