<p align="center">
  <img src="./docs/static/webiny-logo.svg" width="250">
  <br><br>
  <strong>Open-Source Serverless Enterprise CMS</strong>
</p>
<p align="center">
  <a href="https://www.webiny.com">Website</a> |
  <a href="https://www.webiny.com/docs/webiny/introduction/">Documentation</a> |
  <a href="https://www.webiny.com/slack">Community Slack</a> |
  <a href="https://github.com/webiny/webiny-js/discussions">Forum</a> |
  <a href="https://twitter.com/WebinyCMS">Twitter</a> 
</p>

#

<p align="center">

[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/webiny/webiny-js/blob/master/LICENSE)
[![SemVer](http://img.shields.io/:semver-2.0.0-brightgreen.svg)](http://semver.org)
![](https://img.shields.io/npm/types/scrub-js.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](/docs/CODE_OF_CONDUCT.md)
[![Join our Slack community https://www.webiny.com/slack](https://img.shields.io/badge/Slack-Join%20our%20community!-orange)](https://www.webiny.com/slack)

</p>


https://user-images.githubusercontent.com/2216344/194592342-2a63da40-136c-4190-9776-680d1ac2382f.mp4


Webiny Serverless CMS includes:

1️⃣ **Page Builder** - Drag&drop page editor. Pages are prerendered automatically and cached on CloudFront for lightning-fast delivery. 

2️⃣ **Headless CMS** - Headless CMS with a GraphQL API. Build APIs and content models through a UI. It includes content revisions, localization, and fine-grain permission control.

3️⃣ **File Manager** - Upload files images. Search and organize your assets. It includes a built-in image editor for basic image manipulations.

4️⃣ **Form Builder** - Build forms with a drag&drop editor. Insert forms through Page Builder into your pages. It has webhook support and ReCaptcha integration.


All Webiny apps can be customized easily to fully fit an enterprise publishing workflow and integrate with leading identity providers like OKTA and Cognito.
<br /><br />

## 🏁 Quick installation guide

1. Create a Webiny project:

`npx create-webiny-project my-new-project`

2. Deploy to your AWS cloud:

`yarn webiny deploy`


**Prerequisites**

- Node.js ^12 || ^14
- yarn ^1.22.0 || ^2
- AWS account

For the detailed install guide, please see 👉 https://www.webiny.com/docs/get-started/install-webiny

Need help, having trouble installing, find us on our community slack 👉 https://www.webiny.com/slack
<br /><br />

## 📕 Documentation

For complete documentation 👉 https://www.webiny.com/docs
<br /><br />

## 🤝 Community & Support

Community Forum. Best for: help with building, discussion about database best practices 👉 https://www.webiny.com/slack

GitHub Issues. Best for: bugs and errors you encounter using Webbiny 👉 https://github.com/webiny/webiny-js/issues
<br /><br />

## 💪 Contributing

Webiny is all about the community. Please feel free to join in, whether it's fixing bugs, improving our documentation, or simply spreading the word. Please see our [Contributing Guidelines](/docs/CONTRIBUTING.md), which explain project organization, setup, testing, and other steps.
If you need any assistance in contribution, please reach out via our [community Slack](https://www.webiny.com/slack).
<br /><br />

## 📜 License

This project is licensed under the terms of the [MIT license](/LICENSE) except for the following modules, which require a Webiny Enterprise license:

- Multi-tenancy module
- OKTA integration

Contact sales@webiny.com for more information.

Why are those modules paid? It's a way we support the development of the project!
<br /><br />

## 👷‍♀️ When to use Webiny?

Webiny has many features, too many to list to make this readme digestible, so instead of talking about features, here are the common use-cases you can satisfy using Webiny: 

- **Headless CMS** - Programmatically integrate your apps with Webiny's GraphQL Headless CMS.

- **GraphQL API** - You can build a GraphQL API using the [Headless CMS](https://www.webiny.com/serverless-app/headless-cms), but you can [also use the `webiny scaffold` command](https://www.webiny.com/docs/core-development-concepts/scaffolding/extend-graphql-api) to create new GraphQL resolvers where you can add your custom business logic.

- **Marketing landing pages and micro-sites** - Using the [Page Builder](https://www.webiny.com/serverless-app/page-builder) marketing teams can quickly build new websites without knowledge of HTML or CSS. 

- **Multi-tenant SaaS applications** - Webiny has a robust multi-tenancy layer with built-in data separation. You can build your own SaaS applications on top and let Webiny handle the API, security, and data storage for you.

- **Full-stack serverless applications** - Besides using Webiny to manage your content needs, you can expand the existing functionality by creating new full-stack serverless applications on top.

- **Multi-website & multi-language portal** - All Webiny apps are multi-tenant by default, meaning with a single instance of Webiny, you can run hundreds of projects and websites from a single code-base.

- **Dynamic Page** <sup>(coming soon)</sup> - We're working on seamless integration between the Headless CMS and the Page Builder, so you can build and publish dynamic pages without a single line of code or build pipelines required. New content is live instantly and visible to the users.

- **Multi-cloud support** <sup>(coming soon)</sup> - At the moment, Webiny only supports AWS, but we have plans to add support for other cloud vendors such as GCP and Azure. Because Webiny uses cloud-native services to run, not containers, this task is not easy, but we have a plan.

<br /><br />

## ❓ FAQ

**♦ Why serverless?**

We believe serverless is the future of web development. It gives us much more bang for our buck!

**♦ Why open-source?**

Open-source has two main aspects over SaaS: 
1. It's customizable, unlike being locked in a SaaS solution.
2. Your data is stored under your rules, in your data center, with your compliance standard inside your security parameter and delivered through your CDN.

**♦ How is this enterprise?**
1. Webiny is built to be integrated inside enterprise environments. Being open-source is one part of that solution; the other is that Webiny integrates with enterprise IdPs such as OKTA and Cognito.
2. Webiny is architected to sustain heavy usage coming from large volumes of users. 
3. Webiny is built on top of fault-tolerant serverless services.
4. Webiny keeps the data encrypted both in transit and at rest.
5. In the paid edition, enterprises have access to our SLA-based support and consultancy services.

**♦ How fast and scalable is Webiny?**

How about a [load-test](https://www.webiny.com/docs/webiny-overview/performance-benchmark/introduction/) :)

**♦ How much does it cost to run Webiny?**

Webiny comes in 2 database options, DynamoDB + Elasticsearch and DynamoDB only. The latter option, when looking at all the infrastructure pieces Webiny uses to operate, the consumption of the AWS services fully determines the cost. In the DDB + ES option, there is a minimum ~$25/mo charge to AWS for the Elasticsearch cluster as it's not a consumption-based service.

As part of our performance benchmark, we also benchmarked the cost of the DDB + ES, specifically, Headless CMS [read](https://www.webiny.com/docs/webiny-overview/performance-benchmark/headless-cms-read-benchmark#cost-per-10k-requests) and [write](https://www.webiny.com/docs/webiny-overview/performance-benchmark/headless-cms-write-benchmark#cost-per-10k-requests) operations. So that benchmark is a good starting point to determine your cost.

As a rule of thumb, we recommend the DDB option for small and medium-size projects, which should be cheaper when compared to a solution running on VMs or containers.


**♦ Why should my enterprise consider using Webiny?**

Top 5 reasons to do so:
1. **Self-hosted**: Webiny runs inside your own AWS cloud; you keep control over your data and security perimeter.
2. **Open-source**: We released Webiny under the MIT license, so you can customize every aspect of the system to match your needs fully.
3. **Serverless**: Webiny runs on AWS services such as Lambda, S3, and DynamoDB, to offer a highly scalable and fault-tolerant infrastructure.
4. **Cost-savings**: Cut your infrastructure and operations costs by 60% to 80% compared to solutions running on VMs.
5. **Secure**: Webiny follows security best practices by encrypting data both in transit and rest across all services. It integrates with IdPs such as OKTA and Cognito. CodeQL and Dependabot scanning tools ensure code security.

<br />

## Contributors

### 🧡 Thanks goes to these wonderful people!

<a href="https://github.com/webiny/webiny-js/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=webiny/webiny-js" />
</a>
