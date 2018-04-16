/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Main switcher script - fe/be switching with action icon
 *
 * It works well with TYPO3 installations inside subdirectories, because it bases on base href.
 * If base tag is not found in frontend, it builds backend url from current domain.
 */

//console.log('background.js loaded');





var Switcher = {

    DEV : true,
    options : {},

    _currentTab : null,
    _url : null,



    main : function(options)  {

        this.options = options;
        this.DEV = options.ext_debug;

        var isInBackend = Switcher._url.match( /\/typo3\// );


        // IS IN BACKEND

        // click switches to frontend
        if ( isInBackend ) {

            if ( options.switch_fe_openSelectedPageUid ) {
                // tries to extract current pid from backend pagetree and sends a message
                chrome.tabs.executeScript( null, {

                    file: 'getSelectedPageUid.js'

                }, function () {
                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        console.warn('Error injecting script: \n' + chrome.runtime.lastError.message);
                        console.warn('You\'re probably trying to use this extension on some Chrome\'s system page.');
                    }
                });
            }
            else {
                // opens homepage
                Switcher.openFrontend( 0 );
            }
        }



        // IS IN FRONTEND

        // otherwise, open backend
        else {

            if ( options.switch_be_useBaseHref )  {
                // try to find proper backend url and open it
                chrome.tabs.executeScript( null, {

                    file: 'getBaseHref.js'

                }, function () {
                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        console.warn('Error injecting script: \n' + chrome.runtime.lastError.message);
                        console.warn('You\'re probably trying to use this extension on some Chrome\'s system page.');
                    }
                });
            }
            else {
                // open backend in classic way
                Switcher.openBackend( '' );
            }
        }

    },




    openFrontend : function(pageUid) {
        // remove /typo3/ and everything after it in url. add page id, if received
        var newTabUrl = Switcher._url.replace( /typo3\/.*/, '' )
            + ( pageUid > 0  ?  '?id=' + pageUid  :  '' );

        // note, that this logs only to the extension dev console, not to page devtools.
        console.info('newTabUrl: ' + newTabUrl);

        // open TYPO3 Frontend
        chrome.tabs.create({
            'url': newTabUrl,
            'index': Switcher._currentTab.index + 1
        });
    },




    openBackend : function(siteUrl) {

        // if base tag cannot be read / no url found, try only a domain
        if ( !siteUrl  &&  Switcher._currentTab  &&  Switcher._url ) {
            // thanks to Patrick Lischka for inspirations and his "Fast TYPO3 CMS Backend switch" that I've used for a long time
            // especially for this regexp :)
            //baseHref = _currentTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[0];

            // extract scheme + domain
            var parts = Switcher._url.split( '/' );
            siteUrl = parts[0] + '//' + parts[2];

            /*console.log('url: ' + _url);
            console.log(parts);
            console.log(siteUrl);*/
        }

        // strip trailing slash, if present
        var newTabUrl = siteUrl.replace( /\/$/, '' )
            + '/typo3/';

        console.info('newTabUrl: ' + newTabUrl);

        // finally open TYPO3 Backend tab next to current page:
        chrome.tabs.create({
            'url':      newTabUrl,
            'index':    Switcher._currentTab.index + 1
        });
    },



    openInstallTool : function(siteUrl) {
        // if base tag cannot be read / no url found, try only a domain
        if ( !siteUrl  &&  Switcher._currentTab  &&  Switcher._url ) {

            // extract scheme + domain
            var parts = Switcher._url.split( '/' );
            siteUrl = parts[0] + '//' + parts[2];

            /*console.log('url: ' + _url);
             console.log(parts);
             console.log(siteUrl);*/
        }

        // strip trailing slash, if present
        var newTabUrl = siteUrl.replace( /\/$/, '' )
            + '/typo3/install/';

        console.info('newTabUrl: ' + newTabUrl);

        chrome.tabs.getSelected( null, function (_currentTab) {
            chrome.tabs.create({
                'url':      newTabUrl,
                'index':    _currentTab.index + 1
            });
        });
    }

};






// on click action inject the script to current page

chrome.browserAction.onClicked.addListener(function (tab) {

    // store current tab and its url for later
    Switcher._currentTab = tab;
    Switcher._url = tab.url.toString();


    // get configuration and use defaults if not configured (if null as first param: get all)
    chrome.storage.sync.get({
            switch_fe_openSelectedPageUid : true,
            switch_be_useBaseHref : true,
            ext_debug : false,

            env_enable : false
            //_currentProject : {},
            //_currentContext : {}
        },
        function(options) {
            if ( options.ext_debug )
                console.log('action clicked - inject the script into document');

            Switcher.main( options );
        });
});




// when the injected script gets the content, it sends it using message request, so we get this message here

chrome.runtime.onMessage.addListener(function(request, sender) {


    if ( request  &&  request.action === 'selectedPageUid'  ||  '' ) {

        var selectedPageUid = request.source;
        Switcher.openFrontend( selectedPageUid );
    }



    if (request  &&  request.action === 'baseHref'  ||  '' ) {

        var baseHref = request.source;

        console.info('baseHref: ' + baseHref);
        //console.log('tab object: ' + _currentTab);

	    // prevent wrong url if someone sets base to other value than site's address
        if ( baseHref === '/'  ||  baseHref === 'auto' )	{
            baseHref = '';
        }

        Switcher.openBackend( baseHref );
    }

});




// on install or update open info / changelog page

chrome.runtime.onInstalled.addListener(function() {

    // store install version. if minor (second) number has changed, open webpage with changelog.
    chrome.storage.sync.get( 'internal_installVersion', function(options)  {

        var version = chrome.runtime.getManifest().version;

        if ( options.internal_installVersion.split( '.' )[1] !== version.split( '.' )[1]  ||  !options.internal_installVersion ) {
            chrome.tabs.create({ url: "http://wolo.pl/chrome/#whats-new" });
            chrome.storage.sync.set({ internal_installVersion: version });
        }
    });
});

