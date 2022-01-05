<p align="center">
  <img src="./static/webiny-logo.svg" width="250">
  <br><br>
  <strong>Open-Source Serverless Enterprise CMS</strong>
</p>
<p align="center">
  <a href="https://www.webiny.com">Website</a> |
  <a href="https://www.webiny.com/docs/webiny/introduction/">Documentation</a> |
  <a href="https://www.webiny.com/slack">Community Slack</a> |
  <a href="https://github.com/webiny/webiny-js/discussions">Forum</a> |
  <a href="https://twitter.com/WebinyPlatform">Twitter</a> 
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


https://user-images.githubusercontent.com/3808420/143053809-45de6412-31fa-425a-886e-7ce12014603d.mp4


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

For the detailed install guide, please see 👉 https://www.webiny.com/docs/tutorials/install-webiny

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

- **GraphQL API** - You can build a GraphQL API using the [Headless CMS](https://www.webiny.com/serverless-app/headless-cms), but you can [also use the `webiny scaffold` command](https://www.webiny.com/docs/how-to-guides/scaffolding/graphql-api) to create new GraphQL resolvers where you can add your custom business logic.

- **Marketing landing pages and micro-sites** - Using the [Page Builder](https://www.webiny.com/serverless-app/page-builder) marketing teams can quickly build new websites without knowledge of HTML or CSS. 

- **Multi-tenant SaaS applications** - Webiny has a robust multi-tenancy layer with built-in data separation. You can build your own SaaS applications on top and let Webiny handle the API, security, and data storage for you.

- **Full-stack serverless applications** - Besides using Webiny to manage your content needs, you can expand the existing functionality by creating new full-stack serverless applications on top. Follow [this tutorial](https://www.webiny.com/docs/tutorials/create-custom-application/introduction) to build your own full-stack serverless Pinterest clone.

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

<br /><br />

<!-- CONTREEBUTORS:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
## Contributors

Thanks goes to these wonderful people:

<table>
    <tr><td align="center">
                    <a href="https://github.com/Pavel910">
                        <img src="https://avatars1.githubusercontent.com/u/3920893?v=4" width="100px;" alt="Pavel Denisjuk"/>
                        <br />
                        <sub><b>Pavel Denisjuk</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/doitadrian">
                        <img src="https://avatars0.githubusercontent.com/u/5121148?v=4" width="100px;" alt="Adrian Smijulj"/>
                        <br />
                        <sub><b>Adrian Smijulj</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/SvenAlHamad">
                        <img src="https://avatars3.githubusercontent.com/u/3808420?v=4" width="100px;" alt="Sven"/>
                        <br />
                        <sub><b>Sven</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/ndcollins">
                        <img src="https://avatars0.githubusercontent.com/u/501726?v=4" width="100px;" alt="Nick Collins"/>
                        <br />
                        <sub><b>Nick Collins</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/JetUni">
                        <img src="https://avatars0.githubusercontent.com/u/1317221?v=4" width="100px;" alt="Jarrett"/>
                        <br />
                        <sub><b>Jarrett</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/enmesarru">
                        <img src="https://avatars2.githubusercontent.com/u/40731570?v=4" width="100px;" alt="Furkan KURUTAŞ"/>
                        <br />
                        <sub><b>Furkan KURUTAŞ</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/brunozoric">
                        <img src="https://avatars.githubusercontent.com/u/10399339?v=4" width="100px;" alt="Bruno Zorić"/>
                        <br />
                        <sub><b>Bruno Zorić</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/roman-vabishchevych">
                        <img src="https://avatars3.githubusercontent.com/u/4134474?v=4" width="100px;" alt="Roman Vabishchevych"/>
                        <br />
                        <sub><b>Roman Vabishchevych</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/fodurrr">
                        <img src="https://avatars1.githubusercontent.com/u/10008597?v=4" width="100px;" alt="fodurrr"/>
                        <br />
                        <sub><b>fodurrr</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://thebeast.me/about/">
                        <img src="https://avatars3.githubusercontent.com/u/418747?v=4" width="100px;" alt="John Bampton"/>
                        <br />
                        <sub><b>John Bampton</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://ghuser.io/jamesgeorge007">
                        <img src="https://avatars2.githubusercontent.com/u/25279263?v=4" width="100px;" alt="James George"/>
                        <br />
                        <sub><b>James George</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/Fsalker">
                        <img src="https://avatars1.githubusercontent.com/u/16700631?v=4" width="100px;" alt="Fsalker"/>
                        <br />
                        <sub><b>Fsalker</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/naokia">
                        <img src="https://avatars2.githubusercontent.com/u/5516121?v=4" width="100px;" alt="naokia"/>
                        <br />
                        <sub><b>naokia</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/tjrexer">
                        <img src="https://avatars2.githubusercontent.com/u/7013045?v=4" width="100px;" alt="Tim Rexer"/>
                        <br />
                        <sub><b>Tim Rexer</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/bigb123">
                        <img src="https://avatars2.githubusercontent.com/u/9221943?v=4" width="100px;" alt="Piotr Pałka"/>
                        <br />
                        <sub><b>Piotr Pałka</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="http://jinesh.varia.in">
                        <img src="https://avatars2.githubusercontent.com/u/4205770?v=4" width="100px;" alt="Jinesh Varia"/>
                        <br />
                        <sub><b>Jinesh Varia</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/val-fom">
                        <img src="https://avatars0.githubusercontent.com/u/17828806?v=4" width="100px;" alt="Valentyn Fomenko"/>
                        <br />
                        <sub><b>Valentyn Fomenko</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/Naion">
                        <img src="https://avatars3.githubusercontent.com/u/13139397?v=4" width="100px;" alt="Lenon Tolfo"/>
                        <br />
                        <sub><b>Lenon Tolfo</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/ahmad-reza619">
                        <img src="https://avatars3.githubusercontent.com/u/52902060?v=4" width="100px;" alt="Ahmad Reza"/>
                        <br />
                        <sub><b>Ahmad Reza</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/EmilK15">
                        <img src="https://avatars0.githubusercontent.com/u/9532882?v=4" width="100px;" alt="Emil Kais"/>
                        <br />
                        <sub><b>Emil Kais</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/visshaljagtap">
                        <img src="https://avatars2.githubusercontent.com/u/35190080?v=4" width="100px;" alt="Vishal Jagtap"/>
                        <br />
                        <sub><b>Vishal Jagtap</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/Arvisix">
                        <img src="https://avatars1.githubusercontent.com/u/13711406?v=4" width="100px;" alt="Maxim Moroz"/>
                        <br />
                        <sub><b>Maxim Moroz</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://ashu96.github.io/">
                        <img src="https://avatars1.githubusercontent.com/u/13612227?v=4" width="100px;" alt="Ashutosh"/>
                        <br />
                        <sub><b>Ashutosh</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/AlbionaHoti">
                        <img src="https://avatars1.githubusercontent.com/u/22985657?v=4" width="100px;" alt="Albiona"/>
                        <br />
                        <sub><b>Albiona</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/Jeremytijal">
                        <img src="https://avatars3.githubusercontent.com/u/40340340?v=4" width="100px;" alt="Jeremytijal"/>
                        <br />
                        <sub><b>Jeremytijal</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://sundeepcharan.com">
                        <img src="https://avatars3.githubusercontent.com/u/32637757?v=4" width="100px;" alt="Sundeep Charan Ramkumar"/>
                        <br />
                        <sub><b>Sundeep Charan Ramkumar</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/boyuan459">
                        <img src="https://avatars0.githubusercontent.com/u/8401511?v=4" width="100px;" alt="boyuan459"/>
                        <br />
                        <sub><b>boyuan459</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="http://alexoliynyk.me/">
                        <img src="https://avatars2.githubusercontent.com/u/10714670?v=4" width="100px;" alt="Alex Oliynyk"/>
                        <br />
                        <sub><b>Alex Oliynyk</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://www.linkedin.com/in/rahulsuresh98/">
                        <img src="https://avatars2.githubusercontent.com/u/22114682?v=4" width="100px;" alt="Rahul Suresh"/>
                        <br />
                        <sub><b>Rahul Suresh</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/jmrapp1">
                        <img src="https://avatars0.githubusercontent.com/u/376226?v=4" width="100px;" alt="Jon R"/>
                        <br />
                        <sub><b>Jon R</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/afzalsayed96">
                        <img src="https://avatars1.githubusercontent.com/u/14029371?v=4" width="100px;" alt="Afzal Sayed"/>
                        <br />
                        <sub><b>Afzal Sayed</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/Anshuman71">
                        <img src="https://avatars2.githubusercontent.com/u/28081510?v=4" width="100px;" alt="Anshuman Bhardwaj"/>
                        <br />
                        <sub><b>Anshuman Bhardwaj</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/TommyJackson85">
                        <img src="https://avatars3.githubusercontent.com/u/22279028?v=4" width="100px;" alt="Teejay85"/>
                        <br />
                        <sub><b>Teejay85</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/jarretmoses">
                        <img src="https://avatars3.githubusercontent.com/u/4745679?v=4" width="100px;" alt="Jarret Moses"/>
                        <br />
                        <sub><b>Jarret Moses</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/latotty">
                        <img src="https://avatars1.githubusercontent.com/u/1082900?v=4" width="100px;" alt="LaTotty"/>
                        <br />
                        <sub><b>LaTotty</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/markwilcox">
                        <img src="https://avatars1.githubusercontent.com/u/979220?v=4" width="100px;" alt="Mark Wilcox"/>
                        <br />
                        <sub><b>Mark Wilcox</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/anushkrishnav">
                        <img src="https://avatars3.githubusercontent.com/u/54374648?v=4" width="100px;" alt="A N U S H"/>
                        <br />
                        <sub><b>A N U S H</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/aloks98">
                        <img src="https://avatars3.githubusercontent.com/u/45600289?v=4" width="100px;" alt="Alok Kumar Sahoo"/>
                        <br />
                        <sub><b>Alok Kumar Sahoo</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/sccalabr">
                        <img src="https://avatars1.githubusercontent.com/u/4111230?v=4" width="100px;" alt="sccalabr"/>
                        <br />
                        <sub><b>sccalabr</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/ng29">
                        <img src="https://avatars2.githubusercontent.com/u/26463272?v=4" width="100px;" alt="Nitin Gupta"/>
                        <br />
                        <sub><b>Nitin Gupta</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/BhuwanChandra">
                        <img src="https://avatars1.githubusercontent.com/u/46065877?v=4" width="100px;" alt="Bhuwan Chandra"/>
                        <br />
                        <sub><b>Bhuwan Chandra</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/iamdarshshah">
                        <img src="https://avatars2.githubusercontent.com/u/25670841?v=4" width="100px;" alt="Darsh Shah"/>
                        <br />
                        <sub><b>Darsh Shah</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/ankurvr">
                        <img src="https://avatars.githubusercontent.com/u/3338156?v=4" width="100px;" alt="Ankur Raiyani"/>
                        <br />
                        <sub><b>Ankur Raiyani</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/karthick3018">
                        <img src="https://avatars.githubusercontent.com/u/47154512?v=4" width="100px;" alt="Karthick Raja"/>
                        <br />
                        <sub><b>Karthick Raja</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/facorread">
                        <img src="https://avatars.githubusercontent.com/u/127711?v=4" width="100px;" alt="Fabio A. Correa"/>
                        <br />
                        <sub><b>Fabio A. Correa</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/IzioDev">
                        <img src="https://avatars.githubusercontent.com/u/9900846?v=4" width="100px;" alt="Romain Billot"/>
                        <br />
                        <sub><b>Romain Billot</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/snstanton">
                        <img src="https://avatars.githubusercontent.com/u/209370?v=4" width="100px;" alt="Scott Stanton"/>
                        <br />
                        <sub><b>Scott Stanton</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/nelsonchen5">
                        <img src="https://avatars.githubusercontent.com/u/31781643?v=4" width="100px;" alt="Nelson Chen"/>
                        <br />
                        <sub><b>Nelson Chen</b></sub>
                    </a>
                    <br />
                </td></tr><tr><td align="center">
                    <a href="https://github.com/dibenso">
                        <img src="https://avatars.githubusercontent.com/u/11963087?v=4" width="100px;" alt="Dillon Benson"/>
                        <br />
                        <sub><b>Dillon Benson</b></sub>
                    </a>
                    <br />
                </td><td align="center">
                    <a href="https://github.com/econtentmaps">
                        <img src="https://avatars.githubusercontent.com/u/61049336?v=4" width="100px;" alt="econtentmaps"/>
                        <br />
                        <sub><b>econtentmaps</b></sub>
                    </a>
                    <br />
                </td></tr>
</table>
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- CONTREEBUTORS:END -->
