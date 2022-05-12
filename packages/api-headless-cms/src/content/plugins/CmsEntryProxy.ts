// import { CmsEntry as CmsEntryType, CmsModel, CmsStorageEntry } from "~/types";
// import { PluginsContainer } from "@webiny/plugins";
//
// type CmsEntryValues = Record<string, any>;
// interface CmsEntryParams {
//     model: CmsModel;
//     entry: CmsEntryType;
//     plugins: PluginsContainer;
// }
//
// export class CmsEntryProxy {
//     private readonly __plugins: PluginsContainer;
//     private readonly __entry: CmsEntryType;
//     private readonly __model: CmsModel;
//
//     public constructor({ model, entry, plugins }: CmsEntryParams) {
//         this.__model = model;
//         this.__entry = entry;
//         this.__plugins = plugins;
//     }
//
//     public toStorage(): CmsStorageEntry {
//         return {
//             ...this.__entry,
//             values: this.transformValuesToStorage(this.__entry.values)
//         };
//     }
//
//     public fromStorage(): CmsStorageEntry {
//         return {
//             ...this.__entry,
//             values: this.transformValuesFromStorage(this.__entry.values)
//         };
//     }
//
//     private transformValuesToStorage(values: CmsEntryValues): CmsEntryValues {
//         return {
//             ...values
//         };
//     }
//
//     private transformValuesFromStorage(values: CmsEntryValues): CmsEntryValues {
//         return {
//             ...values
//         };
//     }
// }
//
// interface CmsEntryProxyCallableParams {
//     model: CmsModel;
//     entry: CmsEntryType;
// }
// interface CmsEntryProxyCallable {
//     (params: CmsEntryProxyCallableParams): CmsEntryProxy;
// }
//
// export const createCmsEntryProxyFactory = (): CmsEntryProxyCallable => {
//     return ({ model, entry }) => {
//         return new CmsEntryProxy({
//             model,
//             entry,
//             plugins: {} as any
//         });
//     };
// };
