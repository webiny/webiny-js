import * as aws from "@pulumi/aws";

import { PulumiApp, defineAppModule } from "./PulumiApp";

// define a module with some config
const AdminCloudfrontModule = defineAppModule({
    name: "Admin CloudFront",
    // define config type here \/
    run(app, config: { foo: string }) {
        const bucket = app.addResource(aws.s3.Bucket, {
            name: "my-bucket" + config.foo,
            config: {}
        });

        app.addOutput("bucketArn", bucket.output.arn);

        return {
            bucket
        };
    }
});

// define some other module
const AdminOtherModule = defineAppModule({
    name: "Admin Other",
    run(app) {
        // inject other module inside
        const cloudfont = app.getModule(AdminCloudfrontModule);

        // change some config like a boss
        cloudfont.bucket.config.versioning = {
            enabled: true
        };

        // you can use other modules outputs
        // const bucketArn = cloudfont.bucket.output.arn;

        return {};
    }
});

// create the app object
const AdminApp = new PulumiApp({
    name: "Admin"
});

// add first module (config required)
AdminApp.addModule(AdminCloudfrontModule, {
    foo: "asdf"
});

// add second (no config)
AdminApp.addModule(AdminOtherModule);
