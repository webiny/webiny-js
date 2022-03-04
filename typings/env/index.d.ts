declare namespace NodeJS {
    export interface ProcessEnv {
        DB_TABLE?: string;
        DB_TABLE_ELASTICSEARCH?: string;
        ELASTICSEARCH_SHARED_INDEXES?: "true" | string;
        WEBINY_VERSION?: string;
        WEBINY_ENABLE_VERSION_HEADER?: "true" | string;
        WEBINY_LOGS_FORWARD_URL?: string;
        AWS_LAMBDA_FUNCTION_NAME?: string;
        PATH?: string;
        DEBUG?: "true" | string;
        PULUMI_HOME?: string;
        PULUMI_SKIP_UPDATE_CHECK?: "true" | string;
        MOCK_DYNAMODB_ENDPOINT?: string;
        ELASTICSEARCH_PORT?: string;
        WEBINY_ENV?: string;
    }
}