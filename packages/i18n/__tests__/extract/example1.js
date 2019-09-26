export default `
    import i18n from "@webiny/i18n";
    
    const t1 = i18n.namespace('ns1');
    const t2 = i18n.namespace('ns2');
    let t3 = i18n.namespace("ns3");

	const namespaces = {
		t4: i18n.namespace("ns4"),		
		t5: i18n.namespace("ns5"),
	};

    t1\`This is ns1 text.\`
    t2\`This is ns2 text.\`
    
    t2\`This is a text with a {variable} variable and some other {cool} stuff.\`({variable: 'nice', cool: 'really cool'})
`;
