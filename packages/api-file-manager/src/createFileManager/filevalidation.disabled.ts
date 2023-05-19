// /**
//  * Package @commodo/fields does not have types
//  */
// // @ts-ignore
// import { withFields, string, number, onSet } from "@commodo/fields";
// /**
//  * Package commodo-fields-object does not have types
//  */
// // @ts-ignore
// import { object } from "commodo-fields-object";
// import { validation } from "@webiny/validation";
//
// export default (create = true) => {
//     return withFields({
//         key: string({
//             validation: validation.create(`${create ? "required," : ""}maxLength:1000`)
//         }),
//         name: string({ validation: validation.create("maxLength:1000") }),
//         size: number(),
//         type: string({ validation: validation.create("maxLength:255") }),
//         meta: object({ value: { private: false } }),
//         tags: onSet((value: string[]) => {
//             if (!Array.isArray(value)) {
//                 return null;
//             }
//
//             return value.map(item => item.toLowerCase());
//         })(
//             string({
//                 list: true,
//                 validation: (tags: string[]) => {
//                     if (!Array.isArray(tags)) {
//                         return;
//                     }
//
//                     if (tags.length > 15) {
//                         throw Error("You cannot set more than 15 tags.");
//                     }
//
//                     for (let i = 0; i < tags.length; i++) {
//                         const tag = tags[i];
//                         if (typeof tag !== "string") {
//                             throw Error("Tag must be typeof string.");
//                         }
//
//                         if (tag.length > 50) {
//                             throw Error(`Tag ${tag} is more than 50 characters long.`);
//                         }
//                     }
//                 }
//             })
//         )
//     })();
// };
