declare type GetModelType = (context: Object) => any;
export declare const resolveGet: (getModel: GetModelType) => import("graphql").GraphQLFieldResolver<any, any, {
    [argName: string]: any;
}>;
export declare const resolveList: (getModel: GetModelType) => import("graphql").GraphQLFieldResolver<any, any, {
    [argName: string]: any;
}>;
export declare const resolveCreate: (getModel: GetModelType) => import("graphql").GraphQLFieldResolver<any, any, {
    [argName: string]: any;
}>;
export declare const resolveUpdate: (getModel: GetModelType) => import("graphql").GraphQLFieldResolver<any, any, {
    [argName: string]: any;
}>;
export declare const resolveDelete: (getModel: GetModelType) => import("graphql").GraphQLFieldResolver<any, any, {
    [argName: string]: any;
}>;
declare const _default: (modelClass: Function, include: string[]) => {};
export default _default;
