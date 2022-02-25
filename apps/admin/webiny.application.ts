/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */

import { createAdminApp } from "@webiny/pulumi-aws";

export default createAdminApp({
    config(app) {
        app.bucket.config.versioning({
            enabled: false
        });
    },
    beforeBuild() {
        console.log("BEFORE BUILD");
    },
    afterBuild() {
        console.log("AFTER BUILD");
    },
    beforeDeploy() {
        console.log("BEFORE DEPLOY");
    },
    afterDeploy() {
        console.log("AFTER DEPLOY");
    }
});

// type Foo = ResourceConfigProxy<aws.s3.BucketArgs>;

// const args = null as any as aws.s3.BucketArgs;

// type X = pulumi.Unwrap<aws.s3.BucketArgs["grants"]>;
// type Y = Flatten<X>;
// type Z = Inputify<Y>;

// const foo = null as any as Foo;

// foo.grants(grants => {
//     grants = grants || [];

//     return [
//         ...grants,
//         {
//             type: pulumi.output("asdf"),
//             permissions: []
//         }
//     ];
// });

// const x = pulumi.output(args.grants).apply(grants => {
//     const f = grants || [];

//     f.push({
//         type: "asdf",
//         permissions: []
//     });

//     const y: aws.s3.BucketArgs["grants"] = [
//         ...f,
//         {
//             type: pulumi.output("asdf"),
//             permissions: []
//         }
//     ];

//     return pulumi.output(y);
// });

// // foo.grants(grants => {
// //     grants = grants || [];
// //     grants.push({
// //         type: "asdf",
// //         permissions: []
// //     });

// //     grants.forEach(g => g.})
// //     return grants;
// // });

// type Inputify<T> = pulumi.Input<
//     T extends any[] ? Inputify<T[number]>[] : T extends Record<string, any> ? InputifyObject<T> : T
// >;

// type Flatten<T> = T extends any[]
//     ? Flatten<T[number]>[]
//     : T extends Record<string, unknown>
//     ? Exclude<
//           {
//               [K in keyof T]: Flatten<T[K]>;
//           },
//           undefined
//       >
//     : T;

// type InputifyObject<T extends object> = {
//     [K in keyof T]: Inputify<T[K]>;
// };

// type Primitive = number | string | boolean;
