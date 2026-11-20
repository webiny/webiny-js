import { createAbstraction } from "@webiny/feature/admin";
import type { Layout } from "../shared/abstractions.js";

export interface IListLayoutsUseCase {
    // Load the latest revision of every layout: source layouts and their language versions. They're also kept in the repository's observable `layouts`.
    execute(): Promise<Layout[]>;
}

export const ListLayoutsUseCase = createAbstraction<IListLayoutsUseCase>(
    "WebsiteBuilder/ListLayoutsUseCase"
);

export namespace ListLayoutsUseCase {
    export type Interface = IListLayoutsUseCase;
}
