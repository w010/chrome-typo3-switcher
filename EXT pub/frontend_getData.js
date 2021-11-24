

//console.log('getPageSource.js successfully injected');

// todo: confirm it works and apply also in backend_getData if possible
(function(){

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
 * @return {string}
 */
function getCurrentPageUid()    {
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
    testValuesCollection.some(function(testValue){
    //testValuesCollection.forEach(function(testValue){
        if (!testValue) return;
        //console.log(testValue);
        
        // todo: try also url
        
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
}


chrome.runtime.sendMessage({
    action: 'frontend_getData',
    data: {
        baseUrl: getBaseUrl(),
        pageUid: getCurrentPageUid(),
    }
});

})();