## Prep

**Prerequisite:** Ensure that you have the AWS CLI configured on your machine with your AWS account (your project will need to be deployed to AWS)

1. After running the initial prompt (which should add the new commenting API to the framework repo) - first **commit** the changes. *(critical as otherwise you may lose them in the next steps)*
2. Next, you will need to generate a new Webiny project that uses the updated framework, or if you have done this in a previous step - update the existing Webiny project. Before you can generate/update the project, you will need to publish the updated framework repo to a local Verdaccio registry. Run `yarn verdaccio:start` – you’ll see Verdaccio logs ending with `“http address http://localhost:4873/”`.
3. Publish all packages to that registry:    
    ```
       npm config set registry http://localhost:4873 
       yarn release --type=verdaccio
    ```
4. Create the project via the Verdaccio tag:
    ```
    cd ..
    npx create-webiny-project@local-npm webiny-commenting-api \
    --tag local-npm \
    --template full \
    --include-commenting-api \
    --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
    ```
5. After some time you should see the output `“success: Congratulations! You've just deployed a brand new project!”` followed by project details - the project is now deployed to AWS. Open the Admin app in your browser and do the initial setup. Keep hold of the 'Manage API'
6. Still in the Admin app, create a new Content Model Group 'benchmarkingModelGroup' and a new Content Model 'benchmarkingModel' within it. Then under 'Content' - create a new benchmarking entry.
7. Navigate to the API playground at `<your_project_domain>/api-playground` and then 'Headless CMS' - 'Manage API'. You might find it easier to test the comments API via Postman - copy the GraphQL API URL from inside the playground (plus the bearer token for the 'graphql' request from the browser dev tools) and then use a Postman GraphQL client to test the requests
8. Get the ID of your 'benchmarking' content entry by calling the `ListBenchmarking` query - you can use this ID to create and manage comments for the entry via the `comment` mutations & queries that the AI assistant should have generated

## Tests
1. Add comment
2. Read comment
3. Update comment with tagged user
4. Add threaded comment
5. Delete comment