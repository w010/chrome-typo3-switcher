


/*
 * Deeplinks:
 * 
 * 1. Out of the box it works with Page id, Language and News - it can open Backend
 * linking directly to the edit form.
 * 
 * It requires proper class or id of <html> or <body>:
 * for example: <body class="page-123 language-2 news-456"> will allow to fetch these uids.
 * 
 * 
 * 2. Custom records can be configured by adding similar way, for example <body class="product-789">  
 * and then adding simple meta tag config into <head> this way:
 *   (for example, using Typoscript:)
 *   page.headerData.7700 = TEXT
 *   page.headerData.7700 = TEXT.value (
 * 
 * <meta name="handyswitcher" content='{
 * 				"deeplink": {
 * 					"products": {
 * 						"table": "tx_myext_domain_model_product",
 * 						"module": "edit",
 * 						"pattern": "(?:product)(?:-|_)(\\d+(\\.\\d)*)",
 * 						"selector": "body",
 * 						"attr": "class"
 *					}}}'>
 * 
 * - that will make possible the Switcher will open backend edit form for the particular record,
 * when switching to Backend from product detail page Frontend.
 * 
 * 
    # Configuration ref:
    #  'table' - record db table name, used to build backend url
    #  'module' - 'edit' (default) or 'page'
    #  'pattern' - ready pattern to match string
    #  'selector' - it will search for that keyword/pattern in that tag
    #  'attr' - in that attribute of that tag
*/


(()=>{

    /**
     * Try to find base url, basically from base[href]
     * @return {string|string}
     */
    function getBaseUrl() {

        let base = document.querySelector('base');
        let baseHref = base  &&  base.href || '';

        // quick visual test
        /*if (baseHref) {
            document.body.style.backgroundColor = "#236c23";
            console.info('baseHref: ' + baseHref);
        } else {
            document.body.style.backgroundColor = "#ac6c6c";
            console.info("No <base> tag found");
        }*/

        return baseHref;
    }

    /**
     * Try to read page uid, which in many cases is given in classname for body or html tag
     * Simple version
     * @return {string}
     */
    /*function getCurrentPageUid()    {
        let pid = 0;
        let testValuesCollection = [];

        // look around DOM for values which can possibly contain page uid. in most cases it's somewhere
        // in body or html tag classes
        let bodyClasses = Array.from( document.querySelector('body').classList.values() );
        let htmlClasses = Array.from( document.querySelector('html').classList.values() );
        testValuesCollection = bodyClasses.concat(htmlClasses);
        // but often it's in one of their id.
        testValuesCollection.unshift( document.querySelector('body').id );
        testValuesCollection.unshift( document.querySelector('html').id );

        // go over these values and look for something that may be it
        testValuesCollection.some((testValue) => {
        //testValuesCollection.forEach(function(testValue){
            if (!testValue) return;
            //console.log(testValue);
            // test each for "pid-", "page_" etc. 
            let resTestA = testValue.match(/(?:page|pid)(?:-|_)(\d+(\.\d)*)/i);
            if ( Array.isArray(resTestA)  &&  typeof resTestA[1] !== 'undefined' )    {
                console.log(resTestA);
                pid = resTestA[1];
                return true;
            }
        });
        //console.log(pid);
        return pid;
    }*/


    /**
     * Try to fetch current record-id from html, usually page-uid, which in many cases is given in classname for body or html tag
     * to make it possible to open it in backend for edition
     * Can also be used to try to find a language, or some record being edited, like news
     *
     * @param {string} lookingFor - may be: page, language, news, record
     * @param {*} selectors - array/object of tag:[attributes] to perform check, example: {body:[id, class]}
     * @param {boolean} tryUrl
     * @return {number}
     */
    function findUid(lookingFor, selectors, tryUrl)    {
        let value = 0;
        let testValuesCollection = [];

        // look around DOM for values which can possibly contain page uid. in most cases it's somewhere
        // in body or html tag classes. also often it's in one of their id.

        // iterate given selectors-tags => attribs
        for (const [tag, attribs] of Object.entries(selectors)) {

            // iterate each attrib
            attribs.forEach((attr) => {
                if (attr === 'id')   {
                    testValuesCollection.unshift( document.querySelector(tag).id );
                }
                if (attr === 'class')   {
                    testValuesCollection = Array.from( document.querySelector(tag).classList.values() )
                        .concat(testValuesCollection);
                }
            });
        }

        // remove empty items
        testValuesCollection = testValuesCollection.filter((n) => {return n; });
        //console.log(testValuesCollection);

        // go over these values and look for something that may be what we're looking for
        testValuesCollection.some((testValue) => {
        //testValuesCollection.forEach(function(testValue){
            if (!testValue) return;
            let resTestA; 
 
            if (lookingFor === 'page')   {
                // test each for "pid-", "page_" etc. 
                resTestA = testValue.match(/(?:page|pid)(?:-|_)(\d+(\.\d)*)/i);
            }
            if (lookingFor === 'language')   {
                // test each for "lang-", "language_" etc. 
                resTestA = testValue.match(/(?:language|lang)(?:-|_)(\d+(\.\d)*)/i);
            }
            if (lookingFor === 'news')   {
                // test each for "news-" etc. 
                resTestA = testValue.match(/(?:news|article|aktuelle)(?:-|_)(\d+(\.\d)*)/i);
            }


            if ( Array.isArray(resTestA)  &&  typeof resTestA[1] !== 'undefined' )    {
                //console.log(resTestA);
                value = resTestA[1];
                return true;
            }

        });

        // todo: try also url
        //console.log(value);
        return Number(value);
    }


    /**
     * Try to find custom record config, parse and using it - get the final value
     * and update the Message
     */
    function searchAddCustomConfig(messageData) {

        const metaElement = document.querySelector('meta[name="handyswitcher"]');

        if (metaElement)    {
            try {
                const jsonString = metaElement.getAttribute('content');
                const switcherMetaConf = JSON.parse(jsonString);

                console.log('Handy Switcher deeplink meta conf:', switcherMetaConf);

                messageData.customDeeplink = {}

                // iterate JSON data / configurations under "deeplink"
                for (const [key, recordConf] of Object.entries(switcherMetaConf.deeplink)) {

                    // Extract the regex pattern and flags
                    const regexPattern = recordConf.pattern;
                    const regexFlags = 'i';
                    const regex = new RegExp(regexPattern, regexFlags);


                    // Step 1: Select the element(s) using the tag
                    const element = document.querySelector(recordConf.selector);
                    if (!element)  throw new Error(`No elements found with selector: ${recordConf.selector}`);

                    // Step 2: Get the value of the specified attribute
                    const attributeValue = element.getAttribute(recordConf.attr);
                    if (!attributeValue)    throw new Error(`Element has no "${recordConf.attr}" attribute.`);

                    // Step 3: Apply the regex to the attribute value
                    const match = attributeValue.match(regex);
                    if (match && match[1]) {
                        //console.log(`- Found number: ${match[1]}`);

                        // update message data
                        messageData.customDeeplink[key] = {
                            'table': recordConf.table,
                            'module': recordConf?.module ?? '',
                            'uid': Number(match[1])
                        };

                    } else {
                        console.warn(`No match found in "${recordConf.attr}" attribute.`);
                    }
                }
            } catch (error) {
                console.error('Handy Switcher - error parsing custom record JSON config:', error.message);
            }
        }
    }


    /**
     * Prepare return data for the Message 
     */
    function prepareData()  {
        let data = {
            // try fetching base tag url
            baseUrl: getBaseUrl(),
            // try to find page id
            pageUid: findUid('page',
                {
                    'html': ['id', 'class'],
                    'body': ['id', 'class']
                },
                true),
            languageUid: findUid('language',
                {
                    'html': ['class'],
                    'body': ['class']
                },
                false),
            newsUid: findUid('news',
                {
                    'html': ['class'],
                    'body': ['class']
                },
                false),
        }

        // can add to data an object: 'customDeeplink', containing set/array of custom params configs,
        // each should contain at least: table and uid
        searchAddCustomConfig(data);

        return data;
    }



    chrome.runtime.sendMessage({
        action: 'frontend_getData',
        data: prepareData(),
    });

})();
