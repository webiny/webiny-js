# webiny-cloud

To build a cloud infrastructure we need the following packages:
- `webiny-cloud-api` - main Webiny API to manage users, sites, api
- `webiny-cloud-client` - a node client to communicate with the Cloud API using an access token.
- `webiny-cli` - a CLI which is used to create projects and uses `webiny-cloud-client` to manage project deployment.


# webiny-cli
- `webiny create api <folder name>`
- `webiny create client <folder name>`
- `webiny deploy api <api folder>`
- `webiny deploy client <client folder>`

## webiny deploy
When a `deploy` is run, we need to check whether an api/client already exists in the cloud.
If not, an api/client is created in the user account and an ID is stored in a `.webiny` file.

### Deploying a client app
For client apps, a file digest is generated and sent to WC, which in turn will forward the digest to Netlify to check which files need to be uploaded.
Once a response is received, CLI will upload the requested files to WC, which will in turn forward the files to Netlify.