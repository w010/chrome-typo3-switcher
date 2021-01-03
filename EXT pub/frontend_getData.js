

//console.log('getPageSource.js successfully injected');


/**
 * Try to find base url, basically from base[href]
 * @return {string|string}
 */
function getBaseUrl() {

    var base = document.querySelector('base');
    var baseHref = base  &&  base.href || '';

    // quick visual test
    /*if (baseHref) {
        document.body.style.backgroundColor = "green";
        console.info('baseHref: ' + baseHref);
    } else {
        document.body.style.backgroundColor = "red";
        console.info("No <base> tag found");
    }*/

    return baseHref;
}

/**
 * Try to read page uid, which in many cases is given in classname for body or html tag 
 * @return {string}
 */
function getCurrentPageUid()    {
    return 'functionality not ready yet';

    let bodyClasses = document.querySelector('body').classList;
    let htmlClasses = document.querySelector('html').classList;
    // todo: also try body id

    // console.log(bodyClasses);
    // console.log(htmlClasses);
    
    bodyClasses.forEach(function(className){
        console.log(className);
        // test each for "pid", "page" etc. 
    });
}


chrome.runtime.sendMessage({
    action: "frontend_getData",
    data: {
        baseUrl: getBaseUrl(),
        pageUid: getCurrentPageUid(),
    }
});

