import Api from './app';
import App from './etc/app';
import middleware from './middleware';
import Services from './services';
import { Entity } from './entity';
import { Auth, AuthError } from './auth';
import ApiResponse from './response/apiResponse';
import ApiErrorResponse from './response/apiErrorResponse';
import Endpoint from './endpoint';
import EndpointMiddleware from './middleware/endpoint';

const services = new Services();
const app = new Api(services);

export default {
    app,
    services,
    middleware,
    App,
    ApiResponse,
    ApiErrorResponse,
    Endpoint,
    EndpointMiddleware,
    Entity,
    Auth,
    AuthError
};

export {
    app,
    services,
    middleware,
    App,
    ApiResponse,
    ApiErrorResponse,
    Endpoint,
    EndpointMiddleware,
    Entity,
    Auth,
    AuthError
};