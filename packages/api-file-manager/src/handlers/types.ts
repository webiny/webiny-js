export interface HandlerEventArgs {
    httpMethod: "POST" | "OPTIONS";
}
interface S3Record {
    s3: {
        object: {
            key?: string;
        };
    };
}
export interface ManageHandlerEventArgs extends HandlerEventArgs {
    Records: S3Record[];
}
export interface DownloadHandlerEventArgs extends HandlerEventArgs {
    pathParameters: {
        path: string;
    };
    queryStringParameters?: {
        width?: string;
    };
}

export interface TransformHandlerEventArgs extends HandlerEventArgs {
    body: {
        key: string;
        transformations: {
            width: string;
        };
    };
}

export interface TransformHandlerBody {
    key: string;
    transformations: {
        width: string;
    };
}

export interface HandlerHeaders {
    [key: string]: string | boolean | undefined;
}
