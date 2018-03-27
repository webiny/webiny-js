export default `
    import {namespace} from "webiny-i18n";
    
    const t1 = namespace('ns1');
    const t2 = namespace('ns2');
    let t3 = namespace("ns3");

	const namespaces = {
		t4: namespace("ns4"),		
		t5: namespace("ns5"),
	};

    t1\`This is ns1 text.\`
    t2\`This is ns2 text.\`
    
    t2\`This is a text with a {variable} variable and some other {cool} stuff.\`({variable: 'nice', cool: 'really cool'})
`;
