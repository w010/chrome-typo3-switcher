



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
     * @return {string}
     * @param {string} match - may be: page, language, news, record
     * @param {*} selectors - array/object of tag:[attributes] to perform check, example: {body:[id, class]}
     * @param {boolean} tryUrl
     */
    function findUid(match, selectors, tryUrl)    {
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
 
            if (match === 'page')   {
                // test each for "pid-", "page_" etc. 
                resTestA = testValue.match(/(?:page|pid)(?:-|_)(\d+(\.\d)*)/i);
            }
            if (match === 'language')   {
                // test each for "lang-", "language_" etc. 
                resTestA = testValue.match(/(?:language|lang)(?:-|_)(\d+(\.\d)*)/i);
            }
            // todo: news (assume class will be like: detail-news-n) 
            // todo: any records (assume class will be like: detail-record__tx_domain_model_xxxx-n) 

            if ( Array.isArray(resTestA)  &&  typeof resTestA[1] !== 'undefined' )    {
                //console.log(resTestA);
                value = resTestA[1];
                return true;
            }

        });

        // todo: try also url
        //console.log(value);
        return value;
    }

    chrome.runtime.sendMessage({
        action: 'frontend_getData',
        data: {
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
                    'html': ['id', 'class'],
                    'body': ['id', 'class']
                },  
                true),
        }
    });

})();
