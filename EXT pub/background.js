/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017-2021
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Main switcher script - fe/be switching with action icon
 *
 * It works well with TYPO3 installations inside subdirectories, because it bases on base href.
 * If base tag is not found in frontend, it builds backend url from current domain.
 */






let Switcher = {

    DEV: false,
    DEBUG: 0,
    options: {},

    // todo: describe these
    _currentTab: null,
    _url: null,

    // test: try to pass the pid value to backend that way
    _pageUid: 0,

    backendPath: '',


    main: function(options)  {

        Switcher.options = options;
        Switcher.DEV = options.ext_dev;
        Switcher.DEBUG = options.ext_debug;

        Switcher.backendPath = options.ext_backend_path ?? 'typo3';

        let isInBackend = Switcher._url.match( new RegExp('/'+ (Switcher.backendPath)
                            .replaceAll('/', '\\/')
                            .replaceAll('.', '\\.') +'/')
        );


        // IS IN BACKEND

        // click switches to frontend
        if ( isInBackend ) {

            if ( options.switch_fe_openSelectedPageUid ) {
                // tries to extract current pid from backend pagetree and sends a message
                chrome.tabs.executeScript( Switcher._currentTab?.id, {

                    file: 'backend_getData.js'

                }, () => {
                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        console.info('Error injecting script: \n' + chrome.runtime.lastError.message);
                        console.info('You\'re probably trying to use this extension on some Chrome\'s system page.');
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
                chrome.tabs.executeScript( Switcher._currentTab?.id, {

                    file: 'frontend_getData.js'

                }, () => {
                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        console.info('Error injecting script: \n' + chrome.runtime.lastError.message);
                        console.info('You\'re probably trying to use this extension on some Chrome\'s system page.');
                    }
                });
            }
            else {
                // open backend in classic way
                Switcher.openBackend( '' );
            }
        }
    },




    openFrontend: function(pageUid) {
        // remove backend path segment and everything after it in url. add page id, if received
        // todo: try to get id from the url first for 11

        let newTabUrl = Switcher._url.replace( new RegExp('/'+
                    Switcher.backendPath
                +'/.*'), '/' )
            + ( pageUid > 0  ?  '?id=' + pageUid  :  '' );

        // note, that this logs only to the extension dev console, not to page devtools.
        console.info('newTabUrl: ' + newTabUrl);

        // open TYPO3 Frontend
        chrome.tabs.create({
            'url': newTabUrl,
            'index': Switcher._currentTab.index + 1
        });
    },




    openBackend: function(siteUrl, pageUid) {

        // if base tag cannot be read / no url found, try only a domain
        if ( !siteUrl  &&  Switcher._currentTab  &&  Switcher._url ) {
            // thanks to Patrick Lischka for inspirations and his "Fast TYPO3 CMS Backend switch" that I've used for a long time
            // especially for this regexp :)
            //baseHref = _currentTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[0];

            // extract scheme + domain
            let parts = Switcher._url.split( '/' );
            siteUrl = parts[0] + '//' + parts[2];

            /*console.log('url: ' + _url);
            console.log(parts);
            console.log(siteUrl);*/
        }

        // strip trailing slash, if present
        let newTabUrl = siteUrl.replace( /\/$/, '' )
            + '/'+Switcher.backendPath+'/';

        console.info('newTabUrl: ' + newTabUrl);

        // finally open TYPO3 Backend tab next to current page:
        chrome.tabs.create({
                'url':      newTabUrl,
                'index':    Switcher._currentTab.index + 1
            }, (tab) => {
                //console.log(tab);

                // store page uid and try to make use of it in backend, once it loads
                // Env.tabs_setup[tab.id] = {
                //     'pageUid': pageUid,
                //     'onLoad': 'PRESELECT_PAGE',
                // };

                // pagetree preselect

return;

// TODO: GET RID OF ALL NEXT TEMPORARY CODE, I JUST HAD TO COMMIT THESE EXPERIMENTS TO GO TO MANIFEST 3 UPDATE.
// Currently, on win 11-13 this is probably not needed to experiment with pagetree injection, because deep links just works in BE
// TODO: implement Backend deep links instead            

                // chrome.tabs.executeScript( tab.id, {
                chrome.tabs.executeScript( tab.id, {
                                            
                        file: 'backend_test.js',

                        /*code: 'let badge_params = {' +
                            'DEV: '+Env.DEV+',' +
                            'DEBUG: '+Env.DEBUG+',' +
                            'projectLabelDisplay: '+( typeof Env.options.env_badge_projectname === 'undefined'  ||  Env.options.env_badge_projectname === true  ?  'true'  :  'false' )+',' +
                            'scale: '+( typeof Env.options.env_badge_scale !== 'undefined'  ?  parseFloat( Env.options.env_badge_scale )  :  1.0 )+',' +
                            'position: "'+( typeof Env.options.env_badge_position !== 'undefined'  ?  Env.options.env_badge_position  :  'left' )+'",' +
                        '};',*/
                        
                        /*code: 'var pagepreselect_params = {' +
                               // 'DEV: '+Switcher.DEV+',' +
                                //'DEBUG: '+Switcher.DEBUG+',' +
                                'pageUid: "'+pageUid+'",' +
                                'backendUrl: "'+Switcher.backendPath+'&v=11111111111",' +
                        '};',*/
                        // allFrames: true,

                    }, (res) => {
//console.log(res);
                            // on system pages you can't inject any scripts
                            if (chrome.runtime.lastError) {
                                console.warn('Switcher.openBackend(): Error executing code: \n' + chrome.runtime.lastError.message);
                            } else {

                                
                                chrome.tabs.sendMessage(tab.id, {
                                        action: 'backend_preselect',
                                });
                                
                                
                                    // chrome.tabs.executeScript( tab.id, {
                                    /*chrome.tabs.executeScript( tab.id, {


                                        }, (res2) => {
                                                console.log('333 =====================');
                                                console.log(tab.id);
                                                console.log(res2);
                                                if ( chrome.runtime.lastError ) {
                                                    console.warn("Error injecting preselect script: \n" + chrome.runtime.lastError.message);
                                                }
                                    });*/
                            }
                    });


    // return;
    
                // let loopWaitStatusDone = false;
                // let c = 0;
                
                
                /*(() => {
                        console.log("GO !");
                  var i = 0;
                  while (new Promise(resolve => setTimeout(() => resolve(i++), 1000)) < 100) {
                    console.log("I get printed 100 times every second");
                  }
                })();*/
    
                /*let fun = function(c) {
                    console.log(c);
                    if( ++c > 10)
                        clearInterval(incrementEveryOneSecond);
                }
                
                let incrementEveryOneSecond = window.setInterval(fun, 1000, c); 
                console.log('-----STOP!!=----------');
                
                incrementEveryOneSecond;*/
                
                
                /*while ( loopWaitStatusDone === false ) {
                    console.log (tab.status);
                    
                    
                                        
                        
                    ((c) => {
                    
                        setTimeout(() => {
                            c++;
                            console.log (tab.status);
                            if (tab.status === 'done'  ||  c > 4)  {
                                loopWaitStatusDone = true;
                            }
                        }, 1000);
                    
                    })(c++)
                }*/
                
                
                /*while ( loopWaitStatusDone === false ) {
                    console.log (tab.status);
                    ((c) => {
                    
                        setTimeout(() => {
                            c++;
                            console.log (tab.status);
                            if (tab.status === 'done'  ||  c > 4)  {
                                loopWaitStatusDone = true;
                            }
                        }, 1000);
                    
                    })(c++)
                }*/
                
                //console.log(loopWaitStatusDone);
                
    
                // for now, run with some delay. later try with loop to detect status = loaded
                /*setTimeout(() => {
                    console.log(tab.status);
    
                    chrome.tabs.executeScript( tab.id, {
    // temporary 11 backend url for tests
                            code: //'console.log("PRESELECT config inserted");' +
                                    //'debugger' + "\n" +
                                'let pagepreselect_params = {' +
                                    'DEV: '+Switcher.DEV+',' +
                                    'DEBUG: '+Switcher.DEBUG+',' +
                                    'pageUid: "'+pageUid+'",' +
                                    'backendUrl: "'+Switcher.backendPath+'&v=11111111111",' +
                                '};'
    
                        }, () => {                         
                            // on system pages you can't inject any scripts
                            if ( chrome.runtime.lastError ) {
                                console.warn('Switcher.openBackend(): Error executing code: \n' + chrome.runtime.lastError.message);
                            }
                            else {
                                // if config executed successfully, now execute the script itself  (not possible to do this at once)
                               
                            }
                        });
                }, 100);*/
    
    
                        
                        
                        /*setTimeout(() => { 
                            
                            console.log(tab.status);
                        
                            
                            chrome.tabs.executeScript( tab.id, {
                                    
                                                    code: 'alert("yyy");' +
                                                        'var pagepreselect_params = {' +
                                                            'DEV: '+Switcher.DEV+',' +
                                                            'pageUid: "'+pageUid+'"' +
                                                            //'_debugEventTriggered: "'+_debugEventTriggered+'"' +
                                                        '};'
                                    
                                    }, function () {
                                                    // on system pages you can't inject any scripts
                                                    if ( chrome.runtime.lastError ) {
                                                        console.warn('Env.setupBadge(): Error executing code: \n' + chrome.runtime.lastError.message);
                                                        console.log('bbbbb');
                                                    }
                                                    else {
                                                        console.log('ccccc');
                                                    }
                                    });
                        }, 10000);*/
                        
                                    // if ( !pageUid )
                                    //     return;
                                    // if ( typeof Switcher.options.env_be_page_preselect !== 'undefined'  &&  Switcher.options.env_be_page_preselect === false )
                                    //     return;
                                    
                        // todo: finish
                        // todo: add option
                                    //console.info('tab id from callback: ' + tab.id);
                        // console.log('222=====================');
                                   /* chrome.storage.local.set({
                                        'pagepreselect_params':  {
                                            'DEV': Switcher.DEV,
                                            'pageUid': pageUid
                                            //'_debugEventTriggered: "'+_debugEventTriggered+'"' +
                                        }
                                    }, function() {*/
                                        
                            // console.log('333=====================');
                            // console.log(tab.id);
                                                // inject into new tab script which does initial stuff, like preselecting page in tree
                                                    
                                                    //console.log('location:', window.location.href);
                                    
                                                    // on system pages you can't inject any scripts
                                                    /*if ( chrome.runtime.lastError ) {
                                                        console.warn('Env.openBackend(): Error executing code: \n' + chrome.runtime.lastError.message);
                                                    }
                                                    else {*/
                                        //}
        });

    },


    /**
     * 
     * @param siteUrl
     * @param shortcutValueFull
     * @param customShortcutNumber
     */
    openCustomShortcut: function( siteUrl, shortcutValueFull, customShortcutNumber ) {
        let shortcutValue = shortcutValueFull.split(" | ")[0];

        chrome.tabs.query( {active: true, currentWindow: true}, (tabs) => {
            let _currentTab = tabs[0];

            let newTabUrl;

            // if begins with slash, treat as path segment and attach to base/domain
            if ( shortcutValue.charAt(0) === '/' )    {

                // if base url didn't come from menu click, it means unknown site (not set up) - try only a domain
                if ( !siteUrl ) {

                    // extract scheme + domain
                    let parts = _currentTab.url.split( '/' );
                    siteUrl = parts[0] + '//' + parts[2];
                    // console.log(siteUrl);
                }

                // strip trailing slash
                newTabUrl = siteUrl.replace( /\/$/, '' )
                    + shortcutValue;
            }
            // if it doesn't start with http, but no slash - treat as external url, but schema is missed - add it
            else if ( !shortcutValue.startsWith('http') )   {
                newTabUrl = 'https://' + shortcutValue;
            }
            // assume good external url
            else    {
                newTabUrl = shortcutValue;
            }

            Env.consoleLogCustom('newTabUrl: ' + newTabUrl, Env.consoleColor.FgMagenta );

            chrome.tabs.create({
                'url':      newTabUrl,
                'index':    _currentTab.index + 1
            });
        });
    },
};






// on Action icon click: read options and run main handler to calculate decision what to open:
// it will try to exec our js on current tab, which will extract (and send back using runtime message)
// tech stuff like basehref, pid (body class) etc. - and then use these to open backend or frontend,
// depending on what it detects we're currently at, what domain, what url segment to strip (if subdir)
// and try to use the pid from fe to open backend with this page already found and open for us.  

chrome.browserAction.onClicked.addListener((tab) => {

    // store current tab and its url for later
    Switcher._currentTab = tab;
    Switcher._url = tab.url.toString();


    // get configuration and use defaults if not configured (if null as first param: get all)
    chrome.storage.sync.get({
            switch_fe_openSelectedPageUid:  true,
            switch_be_useBaseHref:          true,
            ext_dev:                        false,
            ext_debug:                      0,
            env_enable:                     true,
            ext_backend_path:               'typo3',
        },
        (options) => {
            if ( options.ext_dev  &&  options.ext_debug > 0 )
                console.log('action clicked - inject the script into document');

            Switcher.main( options );
        });
});




// when the injected script gets the content, it sends it using message request, so we get this message here

chrome.runtime.onMessage.addListener((request, sender) => {


    // came from BE, now go -> TO FRONTEND
    if ( request?.action === 'backend_getData' ) {
        console.log('received message, action: backend_getData');

        let selectedPageUid = request?.data?.selectedPageUid;
        console.info('data pid: ' + selectedPageUid);
        Switcher.openFrontend( selectedPageUid );
        return;
    }



    // came from FRONT, now go -> TO BACKEND 
    if ( request?.action === 'frontend_getData' ) {
        console.log('received message, action: frontend_getData');

        let baseUrl = request?.data?.baseUrl;
        let selectedPageUid = request?.data?.pageUid;
        Env.log('baseHref: ', null, Env.LEVEL_success, 1, baseUrl, true);
        Env.log('pid: ', null, Env.LEVEL_success, 1, selectedPageUid, true);

	    // prevent wrong url if someone sets base to other value than site's address
        if ( baseUrl === '/'  ||  baseUrl === 'auto' )  {
            baseUrl = '';
        }

        Switcher.openBackend( baseUrl, selectedPageUid );
    }

});




// on install or update: open info / changelog website if it's a big update 

chrome.runtime.onInstalled.addListener(() => {

    // store install version. if major (first) number has changed, open webpage with changelog.
    chrome.storage.sync.get( 'internal_installVersion', (options) => {

        let version = chrome.runtime.getManifest().version;

        if ( typeof options.internal_installVersion === 'undefined' || options.internal_installVersion === '' || options.internal_installVersion.split( '.' )[0] !== version.split( '.' )[0] ) {
            chrome.tabs.create({ url: "http://wolostudio.free.nf/handyswitcher//#whats-new" });
            chrome.storage.sync.set({ internal_installVersion: version });
        }
    });
});

