// Headless page use cases, for extensions that list, read, create and delete pages themselves.
// The gateway abstractions are exported so tests can register their own implementations.
export { ListPagesUseCase, ListPagesGateway } from "~/features/pages/listPages/abstractions.js";
export { ListPagesFeature } from "~/features/pages/listPages/feature.js";
export { GetPageUseCase, GetPageGateway } from "~/features/pages/getPage/abstractions.js";
export { GetPageFeature } from "~/features/pages/getPage/feature.js";
export { CreatePageUseCase, CreatePageGateway } from "~/features/pages/createPage/abstractions.js";
export { CreatePageFeature } from "~/features/pages/createPage/feature.js";
export { DeletePageUseCase, DeletePageGateway } from "~/features/pages/deletePage/abstractions.js";
export { DeletePageFeature } from "~/features/pages/deletePage/feature.js";
// The page update the editor's autosave runs, for extensions that decorate it (e.g. to record each
// save elsewhere once it went through).
export { UpdatePageUseCase, UpdatePageGateway } from "~/features/pages/updatePage/abstractions.js";
export { SharedPageInfrastructureFeature } from "~/features/pages/shared/feature.js";
export type { Page } from "~/domain/Page/Page.js";
export type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
export type { PageGqlDto } from "~/features/pages/createPage/PageGqlDto.js";
