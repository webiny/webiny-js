import { User, Role, RoleGroup, Permission } from "webiny-api-security";
import { Page, Revision, Category } from "webiny-api-cms";

export default [
    () => {
        return {
            entity: Permission,
            data: [
                {
                    name: "Manage users",
                    slug: "manage-users",
                    description: "Manage system users",
                    rules: [
                        {
                            classId: "Security.Users",
                            methods: [
                                { method: "List.Security.Users" },
                                { method: "Create.Security.Users" },
                                { method: "Get.Security.Users" },
                                { method: "Update.Security.Users" }
                            ]
                        }
                    ]
                },
                {
                    name: "Write blog post",
                    slug: "write-blog-post",
                    description: "Allow user to create and edit blog posts",
                    rules: [
                        {
                            classId: "Cms.Pages",
                            methods: [
                                { method: "List.Cms.Pages" },
                                { method: "Get.Cms.Pages" },
                                { method: "Create.Cms.Pages" },
                                { method: "Update.Cms.Pages" }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    async () => {
        return {
            entity: Role,
            data: [
                {
                    name: "Administrator",
                    slug: "administrator",
                    description: "Administrator account"
                },
                {
                    name: "User Manager",
                    slug: "webiny-user-manager",
                    description: "Manage users",
                    permissions: [await Permission.findOne({ query: { slug: "manage-users" } })]
                },
                {
                    name: "Blogger",
                    slug: "blogger",
                    description: "Write blog posts",
                    permissions: [await Permission.findOne({ query: { slug: "write-blog-post" } })]
                }
            ]
        };
    },
    async () => {
        return {
            entity: RoleGroup,
            data: [
                {
                    name: "Administrators",
                    slug: "administrators",
                    description: "Administrator group",
                    roles: [
                        await Role.findOne({ query: { slug: "administrator" } }),
                        await Role.findOne({ query: { slug: "webiny-user-manager" } })
                    ]
                },
                {
                    name: "Bloggers",
                    slug: "bloggers",
                    description: "Bloggers group",
                    roles: [
                        await Role.findOne({ query: { slug: "administrator" } }),
                        await Role.findOne({ query: { slug: "blogger" } })
                    ]
                }
            ]
        };
    },
    async () => {
        return {
            entity: User,
            data: [
                {
                    email: "user1@webiny.com",
                    password: "12345678",
                    firstName: "Fitzgerald",
                    lastName: "Fields",
                    roleGroups: [await RoleGroup.findOne({ query: { slug: "administrators" } })]
                },
                {
                    email: "user2@webiny.com",
                    password: "12345678",
                    firstName: "Umberto",
                    lastName: "Rodriguez",
                    roleGroups: [await RoleGroup.findOne({ query: { slug: "administrators" } })]
                },
                {
                    email: "user3@webiny.com",
                    password: "12345678",
                    firstName: "Oren",
                    lastName: "Russell",
                    roleGroups: [await RoleGroup.findOne({ query: { slug: "bloggers" } })]
                },
                {
                    email: "user4@webiny.com",
                    password: "pass4",
                    firstName: "Isaac",
                    lastName: "Fuller",
                    roleGroups: [await RoleGroup.findOne({ query: { slug: "bloggers" } })]
                },
                {
                    email: "user5@webiny.com",
                    password: "pass5",
                    firstName: "Clarke",
                    lastName: "Fischer",
                    roles: [await Role.findOne({ query: { slug: "blogger" } })]
                },
                {
                    email: "Suspendisse.sed@sollicitudin.ca",
                    password: "16380703 4834",
                    firstName: "Fitzgerald",
                    lastName: "Fields"
                },
                {
                    email: "nunc.ullamcorper.eu@disparturient.ca",
                    password: "16881001 6884",
                    firstName: "Isaac",
                    lastName: "Fuller"
                },
                {
                    email: "orci.Donec@lacuspede.org",
                    password: "16201106 3845",
                    firstName: "Burton",
                    lastName: "Estrada"
                },
                {
                    email: "Integer.vulputate.risus@portaelita.co.uk",
                    password: "16510616 1960",
                    firstName: "Clarke",
                    lastName: "Fischer"
                },
                {
                    email: "lacinia.Sed.congue@Aliquam.co.uk",
                    password: "16520629 3481",
                    firstName: "Leroy",
                    lastName: "Hopkins"
                },
                {
                    email: "lectus.rutrum@Quisqueornare.org",
                    password: "16880906 7435",
                    firstName: "Kevin",
                    lastName: "Finley"
                },
                {
                    email: "non.cursus.non@inlobortis.com",
                    password: "16650621 0258",
                    firstName: "Keith",
                    lastName: "Walker"
                },
                {
                    email: "amet.ultricies@ullamcorper.co.uk",
                    password: "16560601 2994",
                    firstName: "Wade",
                    lastName: "Graves"
                },
                {
                    email: "nibh.Quisque@SednequeSed.net",
                    password: "16030927 2052",
                    firstName: "Oren",
                    lastName: "Russell"
                },
                {
                    email: "nunc.id.enim@massaSuspendisseeleifend.co.uk",
                    password: "16910501 9179",
                    firstName: "Colt",
                    lastName: "Guerra"
                },
                {
                    email: "mauris@urnasuscipit.ca",
                    password: "16840510 7114",
                    firstName: "Brock",
                    lastName: "Floyd"
                },
                {
                    email: "et@quis.edu",
                    password: "16410721 7616",
                    firstName: "Herrod",
                    lastName: "Bates"
                },
                {
                    email: "blandit.mattis@eget.org",
                    password: "16140313 3877",
                    firstName: "Graiden",
                    lastName: "Patterson"
                },
                {
                    email: "libero.et@Suspendisse.ca",
                    password: "16371108 9890",
                    firstName: "Chase",
                    lastName: "Duffy"
                },
                {
                    email: "pellentesque.a@pedePraesent.net",
                    password: "16860124 2095",
                    firstName: "Theodore",
                    lastName: "Kinney"
                },
                {
                    email: "libero.Proin.mi@malesuada.co.uk",
                    password: "16701218 4581",
                    firstName: "Neville",
                    lastName: "Hernandez"
                },
                {
                    email: "lorem.vitae.odio@tellusAenean.edu",
                    password: "16500913 7919",
                    firstName: "Nicholas",
                    lastName: "Morales"
                },
                {
                    email: "Aenean.massa.Integer@Sednuncest.org",
                    password: "16940322 8365",
                    firstName: "Cole",
                    lastName: "Jackson"
                },
                {
                    email: "Phasellus.dolor@sociis.co.uk",
                    password: "16400721 0406",
                    firstName: "Aristotle",
                    lastName: "Harding"
                },
                {
                    email: "Donec.felis.orci@sit.edu",
                    password: "16030220 4342",
                    firstName: "Colby",
                    lastName: "Rowland"
                },
                {
                    email: "eu@at.edu",
                    password: "16041214 9098",
                    firstName: "Steel",
                    lastName: "Cook"
                },
                {
                    email: "odio.Phasellus.at@condimentum.ca",
                    password: "16501128 7751",
                    firstName: "Kennan",
                    lastName: "Pugh"
                },
                {
                    email: "pede.et@etrutrum.net",
                    password: "16390306 0022",
                    firstName: "Joel",
                    lastName: "Weaver"
                },
                {
                    email: "justo.Proin.non@volutpatNullafacilisis.ca",
                    password: "16830729 1487",
                    firstName: "Harper",
                    lastName: "Barry"
                },
                {
                    email: "semper@odioEtiam.com",
                    password: "16270212 0342",
                    firstName: "Griffin",
                    lastName: "Beach"
                },
                {
                    email: "fermentum@adipiscingfringillaporttitor.org",
                    password: "16400313 7769",
                    firstName: "Dexter",
                    lastName: "Perkins"
                },
                {
                    email: "rhoncus.Nullam.velit@ullamcorperDuis.com",
                    password: "16120728 1971",
                    firstName: "Gareth",
                    lastName: "Fernandez"
                },
                {
                    email: "risus.Donec.nibh@dignissimpharetraNam.com",
                    password: "16101130 1882",
                    firstName: "Andrew",
                    lastName: "Bentley"
                },
                {
                    email: "eget.volutpat.ornare@Curabiturdictum.net",
                    password: "16200803 4163",
                    firstName: "Amery",
                    lastName: "Oneil"
                },
                {
                    email: "tristique.senectus.et@etnunc.org",
                    password: "16430727 0159",
                    firstName: "Wayne",
                    lastName: "Mclean"
                },
                {
                    email: "Quisque.fringilla@Seddictum.org",
                    password: "16140702 7737",
                    firstName: "Graham",
                    lastName: "Rios"
                },
                {
                    email: "imperdiet@lorem.net",
                    password: "16050226 8964",
                    firstName: "Honorato",
                    lastName: "Baker"
                },
                {
                    email: "urna@eu.org",
                    password: "16151028 3185",
                    firstName: "Paul",
                    lastName: "Wright"
                },
                {
                    email: "dictum.Phasellus@Quisque.org",
                    password: "16700728 7555",
                    firstName: "Chase",
                    lastName: "Middleton"
                },
                {
                    email: "libero.at@estmauris.org",
                    password: "16480105 9058",
                    firstName: "Brent",
                    lastName: "Hutchinson"
                },
                {
                    email: "ornare@quam.ca",
                    password: "16810808 8454",
                    firstName: "Kevin",
                    lastName: "Hobbs"
                },
                {
                    email: "Donec.egestas.Aliquam@odioauctor.ca",
                    password: "16450805 7959",
                    firstName: "Bradley",
                    lastName: "Ray"
                },
                {
                    email: "Donec@diameudolor.ca",
                    password: "16250128 6187",
                    firstName: "Coby",
                    lastName: "Ellison"
                },
                {
                    email: "Curabitur.dictum@dictummi.org",
                    password: "16140527 8662",
                    firstName: "Phillip",
                    lastName: "Mason"
                },
                {
                    email: "Integer.vulputate.risus@eratvolutpatNulla.org",
                    password: "16750709 2695",
                    firstName: "Paki",
                    lastName: "Wall"
                },
                {
                    email: "scelerisque.neque@dignissimmagnaa.net",
                    password: "16151210 1666",
                    firstName: "Wesley",
                    lastName: "Gregory"
                },
                {
                    email: "elit.a.feugiat@molestieintempus.com",
                    password: "16620522 5029",
                    firstName: "Fitzgerald",
                    lastName: "Mcfarland"
                },
                {
                    email: "Nunc@pellentesquemassa.co.uk",
                    password: "16340530 2344",
                    firstName: "Keith",
                    lastName: "Duran"
                },
                {
                    email: "elementum.dui.quis@nequevitae.org",
                    password: "16670603 3732",
                    firstName: "Cyrus",
                    lastName: "Waters"
                },
                {
                    email: "purus@vulputatelacus.net",
                    password: "16230525 8036",
                    firstName: "Tobias",
                    lastName: "Simmons"
                },
                {
                    email: "montes@adipiscinglobortis.com",
                    password: "16311220 4007",
                    firstName: "Bruno",
                    lastName: "Pitts"
                },
                {
                    email: "parturient.montes.nascetur@laciniaSedcongue.co.uk",
                    password: "16031224 2514",
                    firstName: "Jasper",
                    lastName: "Gardner"
                },
                {
                    email: "pretium.aliquet.metus@egestas.org",
                    password: "16670906 7109",
                    firstName: "Benjamin",
                    lastName: "Santana"
                },
                {
                    email: "nec.ante@Integeraliquamadipiscing.org",
                    password: "16171209 5197",
                    firstName: "Amery",
                    lastName: "Randolph"
                },
                {
                    email: "nisl.Quisque@sagittisfelis.ca",
                    password: "16390525 1124",
                    firstName: "Barrett",
                    lastName: "Kim"
                },
                {
                    email: "ac@Maurismolestiepharetra.net",
                    password: "16600130 0281",
                    firstName: "Cairo",
                    lastName: "Poole"
                },
                {
                    email: "venenatis.vel.faucibus@Suspendisse.co.uk",
                    password: "16120603 5063",
                    firstName: "Dylan",
                    lastName: "Lowe"
                },
                {
                    email: "dictum.cursus@fringillaeuismodenim.net",
                    password: "16011109 8141",
                    firstName: "Matthew",
                    lastName: "Castro"
                },
                {
                    email: "Vestibulum@pedeultrices.org",
                    password: "16990621 7519",
                    firstName: "Lyle",
                    lastName: "Bush"
                },
                {
                    email: "amet.risus@pedesagittisaugue.edu",
                    password: "16631116 1423",
                    firstName: "Linus",
                    lastName: "Palmer"
                },
                {
                    email: "molestie.in@et.net",
                    password: "16850221 6081",
                    firstName: "Malachi",
                    lastName: "George"
                },
                {
                    email: "facilisis@semmagna.net",
                    password: "16121019 1415",
                    firstName: "Beck",
                    lastName: "Hodges"
                },
                {
                    email: "sociis@dis.edu",
                    password: "16220111 9738",
                    firstName: "Warren",
                    lastName: "Morin"
                },
                {
                    email: "vulputate.ullamcorper@vitae.net",
                    password: "16550921 3400",
                    firstName: "Kennedy",
                    lastName: "Clayton"
                },
                {
                    email: "nunc.sed.pede@Curabituregestas.edu",
                    password: "16091026 9984",
                    firstName: "Reuben",
                    lastName: "Kinney"
                },
                {
                    email: "adipiscing@ultrices.edu",
                    password: "16001226 5690",
                    firstName: "Samuel",
                    lastName: "Maynard"
                },
                {
                    email: "ultrices.iaculis.odio@liberoatauctor.net",
                    password: "16930205 2957",
                    firstName: "Keane",
                    lastName: "William"
                },
                {
                    email: "montes.nascetur.ridiculus@pedemalesuadavel.net",
                    password: "16501024 4795",
                    firstName: "Orson",
                    lastName: "Hendrix"
                },
                {
                    email: "Aliquam.vulputate@eunequepellentesque.edu",
                    password: "16180301 8892",
                    firstName: "Asher",
                    lastName: "Grimes"
                },
                {
                    email: "mi.eleifend.egestas@facilisis.edu",
                    password: "16450818 2146",
                    firstName: "Cadman",
                    lastName: "Flores"
                },
                {
                    email: "lobortis@molestieSed.co.uk",
                    password: "16540505 3785",
                    firstName: "Maxwell",
                    lastName: "Pruitt"
                },
                {
                    email: "blandit.Nam@volutpatornarefacilisis.net",
                    password: "16490423 2180",
                    firstName: "Joshua",
                    lastName: "Berger"
                },
                {
                    email: "dolor.Quisque.tincidunt@netusetmalesuada.com",
                    password: "16020525 5730",
                    firstName: "Jakeem",
                    lastName: "Lawson"
                },
                {
                    email: "molestie.sodales@a.co.uk",
                    password: "16111006 0637",
                    firstName: "Vincent",
                    lastName: "Johnston"
                },
                {
                    email: "Fusce.feugiat.Lorem@laoreet.co.uk",
                    password: "16780814 0177",
                    firstName: "Palmer",
                    lastName: "Eaton"
                },
                {
                    email: "varius@eleifendegestas.com",
                    password: "16040620 5369",
                    firstName: "Buckminster",
                    lastName: "Joyce"
                },
                {
                    email: "elit.pellentesque@nonegestasa.co.uk",
                    password: "16290114 2303",
                    firstName: "Colby",
                    lastName: "Kelley"
                },
                {
                    email: "et.ultrices.posuere@a.org",
                    password: "16210703 3363",
                    firstName: "Barclay",
                    lastName: "Henderson"
                },
                {
                    email: "lorem.eu.metus@montesnascetur.co.uk",
                    password: "16840520 7393",
                    firstName: "Victor",
                    lastName: "Baxter"
                },
                {
                    email: "bibendum.sed.est@Ut.org",
                    password: "16630728 0856",
                    firstName: "Hoyt",
                    lastName: "Ballard"
                },
                {
                    email: "cursus.Nunc.mauris@etrutrum.com",
                    password: "16510425 5426",
                    firstName: "Abel",
                    lastName: "Wyatt"
                },
                {
                    email: "dolor.dapibus@Nullaeu.edu",
                    password: "16070825 5013",
                    firstName: "Nero",
                    lastName: "Ellis"
                },
                {
                    email: "enim@lacusvariuset.net",
                    password: "16920522 7201",
                    firstName: "Burke",
                    lastName: "Sutton"
                },
                {
                    email: "lorem@feugiatmetus.net",
                    password: "16761226 5046",
                    firstName: "Derek",
                    lastName: "Leonard"
                },
                {
                    email: "non@purusmaurisa.org",
                    password: "16431223 9264",
                    firstName: "Craig",
                    lastName: "Frost"
                },
                {
                    email: "porttitor.vulputate.posuere@ac.ca",
                    password: "16160602 1838",
                    firstName: "Talon",
                    lastName: "Francis"
                },
                {
                    email: "id.ante@adipiscingfringillaporttitor.net",
                    password: "16960426 4524",
                    firstName: "Henry",
                    lastName: "Finch"
                },
                {
                    email: "id@PhasellusnullaInteger.edu",
                    password: "16801012 8570",
                    firstName: "Jacob",
                    lastName: "Moore"
                },
                {
                    email: "libero.Integer@maurissagittis.net",
                    password: "16060910 3585",
                    firstName: "David",
                    lastName: "Summers"
                },
                {
                    email: "risus.Donec@mauriseu.edu",
                    password: "16250714 9686",
                    firstName: "Holmes",
                    lastName: "Sanders"
                },
                {
                    email: "odio@Quisqueliberolacus.ca",
                    password: "16910723 8272",
                    firstName: "Ali",
                    lastName: "English"
                },
                {
                    email: "Duis@Donectemporest.com",
                    password: "16100205 1173",
                    firstName: "Evan",
                    lastName: "Davenport"
                },
                {
                    email: "mattis.velit@commodoipsumSuspendisse.co.uk",
                    password: "16960609 9563",
                    firstName: "James",
                    lastName: "Crawford"
                },
                {
                    email: "nisl.Maecenas@SednequeSed.com",
                    password: "16140804 8443",
                    firstName: "Keaton",
                    lastName: "Atkins"
                },
                {
                    email: "dictum.augue.malesuada@etpede.com",
                    password: "16850416 1798",
                    firstName: "Daquan",
                    lastName: "Blake"
                },
                {
                    email: "imperdiet.ullamcorper.Duis@arcuMorbisit.com",
                    password: "16670519 7009",
                    firstName: "Calvin",
                    lastName: "Patton"
                },
                {
                    email: "Suspendisse@dignissim.co.uk",
                    password: "16290814 6380",
                    firstName: "Denton",
                    lastName: "Anderson"
                },
                {
                    email: "erat@quis.net",
                    password: "16080416 7807",
                    firstName: "Zane",
                    lastName: "Gibbs"
                },
                {
                    email: "vel.mauris@Nunc.com",
                    password: "16670926 1462",
                    firstName: "Rajah",
                    lastName: "Garrett"
                },
                {
                    email: "sem@nibh.com",
                    password: "16180221 1159",
                    firstName: "Dale",
                    lastName: "Spears"
                },
                {
                    email: "semper@ante.co.uk",
                    password: "16570302 6392",
                    firstName: "Paul",
                    lastName: "Flores"
                },
                {
                    email: "at@Donec.ca",
                    password: "16580421 1836",
                    firstName: "Derek",
                    lastName: "Orr"
                },
                {
                    email: "et@ultrices.co.uk",
                    password: "16960329 6410",
                    firstName: "Kuame",
                    lastName: "Anthony"
                },
                {
                    email: "velit@arcuVestibulum.net",
                    password: "16580720 6783",
                    firstName: "Calvin",
                    lastName: "Cervantes"
                },
                {
                    email: "dictum.eu.eleifend@nonlobortis.co.uk",
                    password: "16581128 7282",
                    firstName: "Stuart",
                    lastName: "Ryan"
                }
            ]
        };
    },
    async () => {
        return {
            entity: Category,
            data: [
                {
                    title: "Static",
                    slug: "static",
                    url: "/"
                }
            ]
        };
    }
];
