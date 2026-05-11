import { createAbstraction } from "@webiny/feature/admin";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface UpdatePageRevisionDescriptionParams {
    id: string;
    revisionDescription: string | undefined;
}

export interface IUpdatePageRevisionDescriptionUseCase {
    execute(params: UpdatePageRevisionDescriptionParams): Promise<void>;
}

export const UpdatePageRevisionDescriptionUseCase =
    createAbstraction<IUpdatePageRevisionDescriptionUseCase>(
        "WebsiteBuilder/UpdatePageRevisionDescriptionUseCase"
    );

export namespace UpdatePageRevisionDescriptionUseCase {
    export type Interface = IUpdatePageRevisionDescriptionUseCase;
    export type Params = UpdatePageRevisionDescriptionParams;
}

export interface IUpdatePageRevisionDescriptionRepository {
    execute(id: string, revisionDescription: string | undefined): Promise<void>;
}

export const UpdatePageRevisionDescriptionRepository =
    createAbstraction<IUpdatePageRevisionDescriptionRepository>(
        "WebsiteBuilder/UpdatePageRevisionDescriptionRepository"
    );

export namespace UpdatePageRevisionDescriptionRepository {
    export type Interface = IUpdatePageRevisionDescriptionRepository;
}

export interface IUpdatePageRevisionDescriptionGateway {
    execute(id: string, revisionDescription: string | undefined): Promise<PageGatewayDto>;
}

export const UpdatePageRevisionDescriptionGateway =
    createAbstraction<IUpdatePageRevisionDescriptionGateway>(
        "WebsiteBuilder/UpdatePageRevisionDescriptionGateway"
    );

export namespace UpdatePageRevisionDescriptionGateway {
    export type Interface = IUpdatePageRevisionDescriptionGateway;
}
