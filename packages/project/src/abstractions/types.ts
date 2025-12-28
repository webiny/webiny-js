export interface IBaseAppParams {
    app: AppName;
}

export type AppName = "core" | "api" | "admin" | "blueGreen" | "sync";
