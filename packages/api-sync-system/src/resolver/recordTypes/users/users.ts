import { createUserOnPutPlugin } from "./usersOnPut.js";
import { createUserOnDeletePlugin } from "./usersOnDelete.js";
import type { ICopyUser, IDeleteUser } from "./types.js";

export interface ICreateUsersPluginsParams {
    copyUser: ICopyUser;
    deleteUser: IDeleteUser;
}

export const createUsersPlugins = (params: ICreateUsersPluginsParams) => {
    return [createUserOnPutPlugin(params), createUserOnDeletePlugin(params)];
};
