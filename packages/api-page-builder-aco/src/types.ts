import { AcoContext } from "@webiny/api-aco/types";
import { Page } from "@webiny/api-page-builder/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { Context as BaseContext } from "@webiny/handler/types";

export interface Context extends BaseContext, AcoContext, PbContext {}

export type PbPageRecordData = Pick<
    Page,
    "id" | "createdOn" | "createdBy" | "savedOn" | "status" | "version" | "locked"
>;
