import * as aws from "@pulumi/aws";

class App {
    bucket: aws.s3.Bucket;
    constructor() {
        this.bucket = new aws.s3.Bucket("admin-app", {
            acl: "public-read",
            forceDestroy: true,
            website: {
                indexDocument: "index.html",
                errorDocument: "index.html"
            }
        });
    }
}

export default App;
