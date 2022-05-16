// import { Plugin, PluginsContainer } from "@webiny/plugins";
// import { CmsEntry, CmsModel, CmsStorageEntry } from "~/types";
//
// interface CmsEntryProxyType {
//     toStorage(): Promise<CmsStorageEntry>;
//     fromStorage(): Promise<CmsEntry>;
// }
//
// interface CmsEntryProxyParams {
//     entry: CmsEntry | CmsStorageEntry;
// }
// class CmsEntryProxy implements CmsEntryProxyType {
//     private readonly __entry: CmsEntry | CmsStorageEntry;
//
//     public constructor({ entry }: CmsEntryProxyParams) {
//         this.__entry = entry;
//     }
//
//     public async toStoragePaths(): Promise<CmsEntry> {
//         return {
//             ...this.__entry,
//             values: this.__entry.values
//         };
//     }
//
//     public async fromPathsStorage(): Promise<CmsStorageEntry> {
//         return {
//             ...this.__entry,
//             values: this.__entry.values
//         };
//     }
// }
//
// class CmsStorageEntryProxy extends CmsEntryProxy {}
//
// interface CmsEntryProxyFactoryPluginCreateFactoryParamsType {
//     model: CmsModel;
//     plugins: PluginsContainer;
// }
//
// export abstract class CmsEntryProxyFactoryPlugin extends Plugin {
//     public static override readonly type: string = "cms.entry.proxyFactory";
//
//     public abstract createProxyFactory(
//         params: CmsEntryProxyFactoryPluginCreateFactoryParamsType
//     ): (entry: CmsEntry) => CmsEntryProxy;
//
//     public abstract createStorageProxyFactory(
//         params: CmsEntryProxyFactoryPluginCreateFactoryParamsType
//     ): (entry: CmsEntry) => CmsStorageEntryProxy;
// }
//
// class DefaultCmsEntryProxyFactoryPlugin extends CmsEntryProxyFactoryPlugin {
//     public override createProxyFactory(
//         params: CmsEntryProxyFactoryPluginCreateFactoryParamsType
//     ): (entry: CmsEntry) => CmsEntryProxy {
//         /**
//          *
//          */
//         /**
//          *
//          */
//         return entry => {
//             return new CmsEntryProxy({ entry });
//         };
//     }
//
//     public override createStorageProxyFactory(
//         params: CmsEntryProxyFactoryPluginCreateFactoryParamsType
//     ): (entry: CmsEntry) => CmsStorageEntryProxy {
//         /**
//          *
//          */
//         /**
//          *
//          */
//         return entry => {
//             return new CmsStorageEntryProxy({ entry });
//         };
//     }
// }
//
// // input
// // class CmsEntryProxy {}
// //     -> transform alias -> fieldId - CmsEntryProxyTransformedAlias
// //         -> CmsEntryProxyTransformedAliasAndValues
// //     -> transform plain value -> compressed - CmsEntryProxyTransformedValues
// //         -> transform aliases -> fieldId - CmsEntryProxyTransformedAliasAndValues
// //
// //
// //
// // class CmsEntryProxyOutput {}
// //     - transform fieldId -> alias - CmsEntryProxyTransformedFieldId
//
// //
// // class CmsEntryProxyTransformedAlias {}
// //
// // class CmsStorageEntryProxy {}
// //
// // class CmsStorageEntryTransformed Proxy {}
