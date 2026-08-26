"use strict";(self.webpackChunk=self.webpackChunk||[]).push([["28"],{11865(e,t,n){n.r(t),n.d(t,{default:()=>j});var a=n(96540),l=n(46951),o=n(58156),r=n.n(o),d=n(42877),s=n.n(d),i=n(70827),u=n.n(i),m=n(72264),c=n(42788),p=n(23312),C=n(13766),g=n(76800),E=n(19434),M=n(2135);let G=`
    message
    code
    data
`,b=`
    id
    name
    slug
    description
    icon
    createdOn
    plugin
    createdBy {
        id
        displayName
        type
    }
`,f=(0,M.Ay)`
    query CmsListContentModelGroups {
        listContentModelGroups {
            data {
                ${b}
                contentModels {
                    modelId
                    name
                }
            }
            error {
                ${G}
            }
        }
    }
`,y=(0,M.Ay)`
    query CmsGetContentModelGroup($id: ID!) {
        contentModelGroup: getContentModelGroup(id: $id){
            data {
                ${b}
            }
            error {
                ${G}
            }
        }
    }
`,h=(0,M.Ay)`
    mutation CmsCreateContentModelGroup($data: CmsContentModelGroupInput!){
        contentModelGroup: createContentModelGroup(data: $data) {
            data {
                ${b}
                contentModels {
                    modelId
                    name
                }
            }
            error {
                ${G}
            }
        }
    }
`,v=(0,M.Ay)`
    mutation CmsUpdateContentModelGroup($id: ID!, $data: CmsContentModelGroupInput!){
        contentModelGroup: updateContentModelGroup(id: $id, data: $data) {
            data {
                ${b}
            }
            error {
                ${G}
            }
        }
    }
`,w=(0,M.Ay)`
    mutation CmsDeleteContentModelGroup($id: ID!) {
        deleteContentModelGroup(id: $id) {
            data
            error {
                ${G}
            }
        }
    }
`;var $=n(89042),k=n(29114);let q=m.R.ns("app-headless-cms/admin/content-model-groups/data-list"),A=[{label:q`Newest to oldest`,sorters:"createdOn_DESC"},{label:q`Oldest to newest`,sorters:"createdOn_ASC"},{label:q`Name A-Z`,sorters:"name_ASC"},{label:q`Name Z-A`,sorters:"name_DESC"}],S=e=>{let{canCreate:t}=e,[n,o]=(0,a.useState)(""),[d,i]=(0,a.useState)(A[0].sorters),{goToRoute:m}=(0,l.rd2)(),{showSnackbar:M}=(0,l.dhV)(),G=(0,E.mK)(),b=(0,E.IT)(f),{showConfirmation:y}=(0,l.Jgm)({dataTestId:"cms.contentModelGroup.list-item.delete-dialog"}),{canDelete:h}=(0,E.JT)(),v=(0,a.useCallback)(e=>{let{name:t}=e;return t.toLowerCase().includes(n)},[n]),S=(0,a.useCallback)(e=>{if(!d)return e;let[t,n]=(0,$.M)(d);return s()(e,[t],[n])},[d]),x=b.loading?[]:r()(b,"data.listContentModelGroups.data",[]),L=new URLSearchParams(location.search).get("id"),I=(0,a.useCallback)(e=>{y(async()=>{let{error:t}=(await G.mutate({mutation:w,variables:{id:e.id},update(t,n){let{data:a}=n,{error:l}=a.deleteContentModelGroup;if(l)return void M(l.message);let o={query:f},r=t.readQuery(o);if(!r||!r.listContentModelGroups)return;let{listContentModelGroups:d}=r,s=d.data.findIndex(t=>t.id===e.id);t.writeQuery({...o,data:{listContentModelGroups:u().delete(d,`data.${s}`)}})}})).data.deleteContentModelGroup;if(t)return M(t.message);M(q`Content model group "{name}" deleted.`({name:e.name})),L===e.id&&m(k.B.ContentModelGroups.List)})},[L]),N=(0,a.useMemo)(()=>a.createElement(C.iD,null,a.createElement(g.l6,{value:d,onChange:i,label:q`Sort by`,description:"Sort groups by",options:A.map(e=>({label:e.label,value:e.sorters}))})),[d]),B=S(""===n?x:x.filter(v)),D=(0,a.useCallback)(()=>{b.refetch()},[]);return a.createElement(C.Tr,{loading:b.loading,data:B,title:q`Content model groups`,actions:t?a.createElement(g.$n,{"data-testid":"new-group-button",onClick:()=>{m(k.B.ContentModelGroups.List,{new:!0})},text:q`New`,icon:a.createElement(c.h,null),size:"sm",className:"ml-xs"}):null,search:a.createElement(l.zQH,{value:n,onChange:o,inputPlaceholder:q`Search content model group...`}),modalOverlay:N,modalOverlayAction:a.createElement(C.uQ,{"data-testid":"default-data-list.filter"}),refresh:D},e=>{let{data:t}=e;return a.createElement(C.B8,{"data-testid":"default-data-list"},t.map(e=>a.createElement(C.ck,{key:e.id,selected:e.id===L},a.createElement(C.Zq,{onClick:()=>{m(k.B.ContentModelGroups.List,{id:e.id})}},a.createElement(C.jX,null,e.name),a.createElement(C.dA,null,e.contentModels.length?q`{contentModels|count:1:content model:default:content models}`({contentModels:e.contentModels.length}):q`No content models`)),h(e,"cms.contentModelGroup")&&a.createElement(C.DS,null,a.createElement(C.im,null,e.plugin?a.createElement(g.m_,{content:"Content model group is registered via a plugin.",side:"bottom",trigger:a.createElement(p.d7,{disabled:!0,"data-testid":"cms.contentModelGroup.list-item.delete"})}):a.createElement(p.d7,{onClick:()=>I(e),"data-testid":"cms.contentModelGroup.list-item.delete"}))))))})};var x=n(62193),L=n.n(x),I=n(35994),N=n(15031),B=n(75382),D=n(47972),_=n(84599),O=n(69160);let Q=m.R.ns("app-headless-cms/admin/content-model-groups/form"),T=e=>{let{newEntry:t}=e,n=(0,I.mN)(),{generateSlug:l}=(0,I._q)(n,"name","slug");return a.createElement(g.xA,null,a.createElement(g.xA.Column,{span:12},a.createElement(I.Y8,{name:"name",validators:B.Eq.create("required,maxLength:100")},a.createElement(g.pd,{"data-testid":"cms.form.group.name",label:Q`Name`,onBlur:l,required:!0}))),a.createElement(g.xA.Column,{span:12},a.createElement(I.Y8,{name:"slug",validators:[B.Eq.create("required,slug")]},a.createElement(g.pd,{label:"Slug",required:!0,disabled:!t}))),a.createElement(g.xA.Column,{span:12},a.createElement(I.Y8,{name:"icon",validators:B.Eq.create("required")},a.createElement(D.a,{label:Q`Group icon`,description:Q`Icon that will be displayed in the main menu.`}))),a.createElement(g.xA.Column,{span:12},a.createElement(I.Y8,{name:"description",defaultValue:""},a.createElement(g.TM,{"data-testid":"cms.form.group.description",rows:5,label:Q`Description`}))))},U=e=>{let{canCreate:t}=e,{goToRoute:n}=(0,l.rd2)(),{route:o}=(0,l.lqj)(k.B.ContentModelGroups.List),{showSnackbar:d}=(0,l.dhV)(),{canEdit:s}=(0,E.JT)(),i=!0===o.params.new,u=o.params.id,m=(0,E.IT)(y,{variables:{id:u},skip:!u,onCompleted:e=>{if(!e)return;let{error:t}=e.contentModelGroup;t&&(n(k.B.ContentModelGroups.List),d(t.message))}}),[c,p]=(0,E.n_)(h,{update(e,t){let{data:n}=t;if(!n||n.contentModelGroup.error)return;let a={query:f},l=e.readQuery(a);if(!l||!l.listContentModelGroups)return;let{listContentModelGroups:o}=l;e.writeQuery({...a,data:{listContentModelGroups:{...o,data:[n.contentModelGroup.data,...o.data]}}})}}),[C,M]=(0,E.n_)(v),G=[m,p,M].find(e=>e.loading),b=(0,a.useCallback)(e=>e.id?C({refetchQueries:["CmsListMenuContentGroupsModels"],variables:{id:e.id,data:{name:e.name,description:e.description,icon:e.icon}}}):c({refetchQueries:["CmsListMenuContentGroupsModels"],variables:{data:{name:e.name,slug:e.slug,description:e.description,icon:e.icon}}}),[c,C]),w=(0,a.useCallback)(async e=>{let t=await b(e);if(!t.data)return void d("Missing response data ain Content Model Group Mutation Response.");let{data:a,error:l}=t.data.contentModelGroup;l?d(l.message):(e.id||n(k.B.ContentModelGroups.List,{id:a.id}),d(Q`Content model group saved successfully!`))},[u]),$=m.loading?null:r()(m,"data.contentModelGroup.data",null);return!i&&!G&&L()($)?a.createElement(l.rkz,{icon:a.createElement(N.h,null),title:Q`Click on the left side list to display group details {message}`({message:t?"or create a...":""}),action:t?a.createElement(g.$n,{text:Q`New Group`,icon:a.createElement(_.h,null),"data-testid":"new-record-button",onClick:()=>{n(k.B.ContentModelGroups.List,{new:!0})}}):a.createElement(a.Fragment,null)}):a.createElement(I.lV,{onSubmit:w,data:$||{icon:"fas/star"}},e=>{let{data:t,form:o}=e;return a.createElement(l.lwG,{"data-testid":"pb-content-model-groups-form"},a.createElement(l.otq,{title:t.name?t.name:Q`New content model group`}),G&&a.createElement(g.Ud,null),a.createElement(l.MOP,null,a.createElement(T,{newEntry:i})),a.createElement(l.ODx,null,a.createElement(g.$n,{variant:"secondary",text:Q`Cancel`,onClick:()=>{n(k.B.ContentModelGroups.List)}}),s(t,"cms.contentModelGroup")&&a.createElement(a.Fragment,null,t.plugin?a.createElement(O.m,{content:"Content model group is registered via a plugin.",placement:"bottom"},a.createElement(g.$n,{disabled:!0,variant:"primary",text:Q`Save`,"data-testid":"cms.form.group.submit"})):a.createElement(g.$n,{variant:"primary",text:Q`Save`,onClick:o.submit,"data-testid":"cms.form.group.submit"}))))})},j=()=>{let{identity:e,getPermission:t}=(0,l.E8j)(),n=(0,a.useMemo)(()=>{let e=t("cms.contentModelGroup");return!!e&&("string"!=typeof e.rwd||e.rwd.includes("w"))},[e]);return a.createElement(l.U_v,null,a.createElement(l.WxU,{span:4},a.createElement(S,{canCreate:n})),a.createElement(l.paj,{span:8},a.createElement("div",{className:"w-full overflow-y-auto h-main-content"},a.createElement(U,{canCreate:n}))))}},89042(e,t,n){n.d(t,{M:()=>a});let a=e=>{if("string"!=typeof e)return e;let[t,n]=e.split("_");return[t,"asc"===String(n).toLowerCase()?"asc":"desc"]}}}]);