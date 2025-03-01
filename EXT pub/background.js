/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo '.' studio 2017-2025
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

    // placeholder to store current/last tab and its url for later
    // set after clicking icon action
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

        // get the tab env configuration, which we stored earlier during setting up matching project
        let tab_setup = Env.tabs_setup[Switcher._currentTab?.id] ?? {};
        // null and empty string safe check
        let finalBackendPath = typeof tab_setup?.envConfig?.project?.backendPathSegment === "string"
            && tab_setup.envConfig.project.backendPathSegment.trim() !== ""
                ? tab_setup.envConfig.project.backendPathSegment
                : Switcher.backendPath;

        //console.log(tab_setup);
        //console.log(finalBackendPath);

        let isInBackend = Switcher._url.match( new RegExp('/'+ (finalBackendPath)
                            .replaceAll('/', '\\/')
                            .replaceAll('.', '\\.') +'/')
        );


        // IS IN BACKEND

        // click switches to frontend
        if ( isInBackend ) {

            if ( options.switch_fe_openSelectedPageUid  &&  Switcher._currentTab?.id ) {
                // tries to extract current pid from backend pagetree and sends a message
                chrome.scripting.executeScript({

                    target: { tabId: Switcher._currentTab.id },
                    files: ['backend_getData.js']

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
                Switcher.openFrontend( 0, finalBackendPath );
            }
        }



        // IS IN FRONTEND

        // otherwise, open backend
        else {

            // not yet such option exist, if it works then add
            if (( 1  ||  options.switch_be_useBaseHref  ||  options.switch_be_openCurrentPageUid )   &&  Switcher._currentTab?.id )  {
                // try to find proper backend url and open it
                chrome.scripting.executeScript({

                    target: { tabId: Switcher._currentTab.id },
                    files: ['frontend_getData.js']

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
                Switcher.openBackend( '', {}, finalBackendPath );
            }
        }
    },


    /**
     * @param pageUid
     * @param backendPath
     */
    openFrontend: function(pageUid, backendPath) {
        // remove backend path segment and everything after it in url. add page id, if received
        // todo: try to get id from the url first for 11

        let newTabUrl = Switcher._url.replace( new RegExp('/'+
                (backendPath ?? Switcher.backendPath)
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


    /**
     * @param siteUrl string
     * @param params {*} parameters fetched from frontend html to build backend deep link
     * @param backendPath
     */
    openBackend: function(siteUrl, params, backendPath) {

        siteUrl = params?.baseHref ?? siteUrl;

        // if base tag cannot be read / no url found, try only a domain
        if ( !siteUrl  &&  Switcher._currentTab  &&  Switcher._url ) {
            // thanks to Patrick Lischka for inspirations and his "Fast TYPO3 CMS Backend switch" that I've used for a long time
            // especially for this regexp :)
            //baseHref = _currentTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[0];

            // extract scheme + domain
            let parts = Switcher._url.split( '/' );
            siteUrl = parts[0] + '//' + parts[2];

            //console.log(parts);
            //console.log(siteUrl);
        }

        // strip trailing slash, if present
        let newTabUrl = siteUrl.replace( /\/$/, '' )
            + '/'+(backendPath ?? Switcher.backendPath)+'/';

        // for typo3 try to build deep links. todo: must be possible to switch this off, because it will cause problems in older than 10/11
        if ((backendPath ?? Switcher.backendPath) === 'typo3')   {
            if ( params?.pageUid )  {
                newTabUrl += 'module/web/layout?id='+params.pageUid
            }
            if ( params?.languageUid )  {
                newTabUrl += '&language='+params.languageUid
            }
        }

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

chrome.action.onClicked.addListener((tab) => {

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

        // determine the tab id from which that message was sent, and read its env config
        let tab_setup = Env.tabs_setup[Switcher._currentTab?.id] ?? {};
        // null and empty string safe check
        let finalBackendPath = typeof tab_setup?.envConfig?.project?.backendPathSegment === "string"
            && tab_setup.envConfig.project.backendPathSegment.trim() !== ""
                ? tab_setup.envConfig.project.backendPathSegment
                : Switcher.backendPath;

        //console.log(finalBackendPath);
        //console.log(tab_setup);

        let selectedPageUid = request?.data?.selectedPageUid;
        console.info('data pid: ' + selectedPageUid);
        Switcher.openFrontend( selectedPageUid, finalBackendPath );
        return;
    }



    // came from FRONT, now go -> TO BACKEND 
    if ( request?.action === 'frontend_getData' ) {
        console.log('received message, action: frontend_getData');

        // determine the tab id from which that message was sent, and read its env config
        let tab_setup = Env.tabs_setup[Switcher._currentTab?.id] ?? {};
        // null and empty string safe check
        let finalBackendPath = typeof tab_setup?.envConfig?.project?.backendPathSegment === "string"
            && tab_setup.envConfig.project.backendPathSegment.trim() !== ""
                ? tab_setup.envConfig.project.backendPathSegment
                : Switcher.backendPath;

        //console.log(finalBackendPath);
        //console.log(tab_setup);


        Env.log('fetch info results: ', null, Env.LEVEL_info, 1, request?.data, true);
        //Env.log('pid: ', null, Env.LEVEL_success, 1, selectedPageUid, true);

        let baseUrl = Switcher.options.switch_be_useBaseHref ? request?.data?.baseUrl : '';
	    // prevent wrong url if someone sets base to other value than site's address
        if ( baseUrl === '/'  ||  baseUrl === 'auto' )  {
            baseUrl = '';
        }
        console.log('request.data from response: ', request.data);

        //Switcher.openBackend( Switcher.options.switch_be_useBaseHref ? baseUrl : '', Switcher.options.switch_be_openCurrentPageUid ? selectedPageUid : 0);
        // todo: add such option, make it default true
        Switcher.openBackend(baseUrl, {pageUid: request?.data?.pageUid, language: request?.data?.languageUid}, finalBackendPath);
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

















/**
 * Context menu script - switching projects between its environments
 * Icon submenu, page submenu, info badges
 *
 * (Note, that 'contextMenus' for chrome means 'right click on context', where 'context' means where it's clicked.
 * - And for us the 'context' (or environment) means the server, where the project runs.
 * It's important in this file, where the context menu are set up. Please remember this and don't mix them!)
 */




let Env = {

    // advanced mode
    DEV: false,
    // level of log details etc. - 3 = see more info in critical situations
    DEBUG: 0,

    options: [],
    projectsAll: [],

    /**
     * @var Array<Object> Store once generated info for each tab id
     */
    tabs_setup: [],

    /**
     * @var Array<Arrays> Store build log for each tab id to output whole at once when finished operation
     */
    tabs_log: [],

    /**
     * To handle some minor browser differences
     */
    engine: 'webkit',

    /**
     * Colors for console output
     */
    consoleColor: {},


    init: function()    {
        // browser simple detection
        if ( typeof browser !== 'undefined' )   {
            Env.engine = 'gecko';
            Env.consoleColor = {
                //FgBlack: '\x1b[30m',
                FgGray: 'color: #aaa;',
                FgRed: 'color: #d00;',
                FgGreen: 'color: green;',
                FgGreenBright: 'color: lightgreen;',
                FgYellow: 'color: yellow;',
                FgBlue: 'color: blue;',
                FgMagenta: 'color: magenta;',
                FgCyan: 'color: cyan;',
                FgWhite: 'color: white;',
            };
        }
        else {
            Env.consoleColor = {
                //FgBlack: '\x1b[30m',
                FgGray: '\x1b[90m',
                FgRed: '\x1b[31m',
                FgGreen: '\x1b[32m',
                FgGreenBright: '\x1b[92m',
                FgYellow: '\x1b[33m',
                FgBlue: '\x1b[34m',
                FgMagenta: '\x1b[35m',
                FgCyan: '\x1b[36m',
                FgWhite: '\x1b[37m',
            };
        }
    },


    /**
     * Read config + preprocess projects array
     * @return {Promise<unknown>}
     */
    promiseConfig: function() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get( null, (options) => {
                    
                    // exit now, if whole env functionality is disabled
                    // not here - reject floods errors to console!
                    /*if ( options?.env_enable !== true )
                        reject('EXIT: ------ \'Switcher: ENV functionality disabled\' ------');*/

                    resolve( options );
                })
            } catch (e) {
                reject(e);
            }
        })
    },
    
    /**
     * Setup
     */
    setupOptions: function(options)   {

        Env.options = options;
        Env.DEV = options.ext_dev;
        Env.DEBUG = options.ext_debug;
        let projects = [];

        // recent raw js method to foreach
        Object.entries(options).forEach( ([key, value]) => {
            if (key.match(/^project_/g)) {
                // if, for some reason, project doesn't have a uuid, take it from key (probably uuid is not needed here, but keep the code in sync with Options) 
                if (typeof options[key].uuid === 'undefined')
                    options[key].uuid = key.replace(/^project_+/g, '');
                projects.push(options[key]);
            }
        });
        // put them in right order
        projects.sort((a, b) => {
            if (a.sorting > b.sorting)  return 1;
            if (a.sorting < b.sorting)  return -1;
            return 0;
        });

        Env.projectsAll = projects;
    },

    /**
     * find current url in projects options. if found - set new menu and badge. otherwise exit
     */
    bindProjectDetection: function()   {
        
        if ( Env.options?.env_enable !== true ) {
            return console.log('EXIT: ------ Switcher: ENV functionality disabled ------');
        }
        
        // common info block, posted to console on every actual run
        let console_setupStartDivider = (triggerEventInfo) => {
            console.info('');
            let timeRun = new Date();
            let timeInfo = timeRun.getHours() + ':' + ('0'+timeRun.getMinutes()).slice(-2) + ':' + ('0'+timeRun.getSeconds()).slice(-2) + '.' + (timeRun.getMilliseconds()+'0').slice(0, 3);
            Env.consoleLogCustom('=============  '+ timeInfo +'   --   Environment Setup'+ triggerEventInfo, Env.consoleColor.FgCyan );
        }

                /*  do the whole job on these specified events hit, to reinit the menu etc. every time in current window a tab
                    is switched / page is loaded in current tab / - basically when current window's content / viewport / url changes
                    we rebuild the menu and replace the action icon indicator
                    (also when focusing other window with tab currently loaded) */


        // on TAB FOCUS

        chrome.tabs.onActivated.addListener( function (activeInfo) {

            let tabId = activeInfo?.tabId ?? 0;

            console_setupStartDivider(' --  event: TAB FOCUS    [tabs.onActivated / activeInfo]');

            if ( Env.runCheck( tabId, 'onActivated', activeInfo ) ) {
                Env.projectDetection( tabId, 'onActivated', activeInfo );
            }
        });




        // on WINDOW SWITCH
        // (focus window with some tab open doesn't hit any event on this tab, so we need this also)

        chrome.windows.onFocusChanged.addListener( function (windowId) {

            console_setupStartDivider(' --  event: WINDOW SWITCH    [windows.onFocusChanged / windowId]');

            if ( Env.lock )   {
                console.log( ': LOCKED! operation in progress. exit' );
                return;
            }

            // gets current tab with details (tab from events only returns id)
            Env.promiseTabsQuery({active: true, lastFocusedWindow: true})
                .then( async tabs => {
                    let tab = tabs[0] ?? {};
                    if ( typeof tab === 'undefined'  ||  !tab  ||  !tab.id ) {
                        console.log('Can\'t read tab (system?) - exit');
                        return;
                    }

                    if ( Env.runCheck( tab.id, 'onFocusChanged', tab ) ) {
                        Env.projectDetection( tab.id, 'onFocusChanged', tab );
                    }
                });
        });




        // on LOAD PAGE

        chrome.tabs.onUpdated.addListener( function (tabId, changeInfo) {



            if ( !changeInfo?.status )   {
                if ( Env.DEBUG > 2 )      Env.consoleLogCustom(': EXIT / Not a page re/load event, but some other onUpdated hit (like injected badge)', Env.consoleColor.FgGray );
                return;
            }

            if ( changeInfo?.status !== 'complete' )   {
                if ( Env.DEBUG > 2 )      Env.consoleLogCustom(': EXIT / Page is still loading', Env.consoleColor.FgGray, tabId );
                return;
            }


            console_setupStartDivider('   --   on: PAGE LOADED    [tabs.onUpdated] / status = completed');

            if ( Env.runCheck( tabId, 'onUpdated', changeInfo ))  {

                // reset visual indicators load status - page reloaded, so must reinit them
                Env.tabs_setup[tabId].badgeLoaded = false;
                Env.tabs_setup[tabId].faviconLoaded = false;

                Env.projectDetection( tabId, 'onUpdated', changeInfo );
            }
        });


        // cleanup on tab close (to avoid the storage array grow too big, also not needed anymore) 

        chrome.tabs.onRemoved.addListener( function (tabId, removeInfo) {

            Env.consoleLogCustom('- TAB CLOSED. wipe cache for: ' + tabId, Env.consoleColor.FgYellow );

            delete Env.tabs_setup[tabId];
            delete Env.tabs_log[tabId];
        });
    },

    /**
     * Check and validate if everything is ok and we can approach the project detection
     * @param tabId
     * @param _debugEventTriggered For debug - event name
     * @param eventResponseData For debug - pass what came from event listener
     */
    runCheck: function(tabId, _debugEventTriggered, eventResponseData)    {

        // init new empty setup cache-storage and log array, if not found there
        // later: will be done somehow different when caching and reusing will be finished
        Env.tabs_setup[tabId] = Env.tabs_setup[tabId] ?? {};
        Env.tabs_log[tabId] = Env.tabs_log[tabId] ?? [];


        // control valid tab id came
        if ( !tabId ) {
            console.log( Env.consoleColor.FgRed + '- ERROR - no tabId from event ' + _debugEventTriggered, eventResponseData );
            return false;
        }

        // check if process is locked, already doing this
        if ( Env.tabs_setup[tabId]?.lock )   {
            Env.consoleLogCustom( '== : LOCKED - operation on this tab is in progress. - EXIT.', Env.consoleColor.FgCyan );
            return false;
        }
        return true;
    },


    /**
     * DO THE URL DETECTION
     *
     * @param tabId
     * @param _debugEventTriggered For debug - event name
     * @param eventResponseData For debug - pass what came from event listener
     */
    projectDetection: function(tabId, _debugEventTriggered, eventResponseData)    {

        if ( Env.tabs_setup[tabId]?.lock )  {
            return;
        }

        // set lock
        Env.tabs_setup[tabId].lock = true;
        Env.logGroup( '== SETUP TAB id = '+tabId, true, tabId );
        Env.log( '[LOCK]', tabId, 1, 0 );


        // make a 10-50ms delay to avoid colliding flood runs, which can mysteriously start between locks
        setTimeout(() => {

            // START SETUP


            // Cleanup
            
            // deactivate icon
            // do this later, to avoid ugly blink on every tab switch
            // Env.log( '-- ICON: deactivate', tabId, 0, 2 );
            // Env.setActionIcon( '', tabId );
    
            // empty current menu (action + rmb)
            Env.log('-- MENU: flush', tabId, 0, 2 );

            // the promise-way was supposed to help the menu "duplicate id" / cleaning menu problem, but it didn't actually
            // change anything, the callback after removeAll just seems to run too early before menu is really empty
            let flushMenu = new Promise((resolve, reject) => {
                chrome.contextMenus.removeAll(() => {
                    if (chrome.runtime.lastError)   {
                        reject(chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            });

            flushMenu
                .then( () => {
                    
                    // REQUEST AND SETUP CURRENT TAB ONCE THE MENU IS EMPTIED
                    Env.findAndApplyProjectConfigForCurrentTabUrl( tabId, _debugEventTriggered );
                    

                    // this construction here was an absurd, it did the query twice...
                    /*Env.promiseTabsGet(tabId)
                        .then( async tab => {
                            Env.log('* Got Tab object - START ->>>', tabId, 1, 1 );
                            Env.log('- TAB object', tabId, Env.LEVEL_debug, 2, tab );

                            // ! in that bug situation it doesn't fail, it just returns undefined in success-way!
                            if ( typeof tab === 'undefined' ) {
                                Env.log( ' ! ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION !', tabId, 3 );
                                Env.log( ' - tabId: ' + tabId + ' event: ' + _debugEventTriggered, tabId, 3, 1, eventResponseData );
                                Env.log( ' - output from .runtime.lastError: ' + chrome.runtime.lastError.message, tabId, 3, 0 )
                                Env.log( ' : EXIT / No tab object for some reason', tabId, 1 );
                                Env.helper_finishProjectSetup(tabId, true);
                                return;
                            }

                            Env.findAndApplyProjectConfigForCurrentTabUrl( tabId, _debugEventTriggered );

                        })
                        .catch( (e) => {
                            //console.log( Env.consoleColor.FgRed + e );
                            Env.log( e, tabId, -1, 0 );
                            Env.helper_finishProjectSetup(tabId, true);
                        });*/
                });

        }, 30 );
    },

    
    /**
     * Get tab by id - not used now but we can keep
     * @return {Promise<unknown>}
     */
    promiseTabsGet: function(tabId ) {
        return new Promise((resolve, reject) => {
            /*try {
                // workaround for chrome 91 bug with error 'Tabs cannot be edited right now (user may be dragging a tab).'
                const loop = function () {
                
                    chrome.tabs.get( tabId, function(tab) {
                        if (chrome.runtime.lastError)   {
                            Env.log(chrome.runtime.lastError.message, tabId, 2, 1)
                        }

                        if (tab)    {
                            resolve( tab );
                        }
                        else    {
                            setTimeout(() => {
                                // false value doesn't resolve, when passed, in that case 'then' is called
                                Promise.resolve( tab )
                                    .then( loop )
                                    .catch( reject );
                            }, 200);
                        }
                    });
                }
                loop();

            } catch (e) {
                reject(e);
            }*/

            // todo: restore / cleanup once they fixed that

            // normally this should work:
            try {
                chrome.tabs.get( tabId, async function(tab) {
                    resolve( tab );
                });
            } catch (e) {
                reject(e);
            }
        })
    },

    /**
     * Get tabs
     * @return {Promise<unknown>}
     */
    promiseTabsQuery: function( query ) {
        return new Promise((resolve, reject) => {
            /*try {
                // workaround for chrome 91 bug with error 'Tabs cannot be edited right now (user may be dragging a tab).'
                const loop = function () {

                    chrome.tabs.query( query, async function(tabs) {
                        if (chrome.runtime.lastError)   {
                            Env.log(chrome.runtime.lastError.message, tabs, 2, 1)
                        }
                        if (tabs)    {
                            resolve( tabs );
                        }
                        else    {
                            setTimeout(() => {
                                Promise.resolve( tabs )
                                    .then( loop )
                                    .catch( reject );
                            }, 200);
                        }
                    });
                }
                loop();

            } catch (e) {
                reject(e);
            }*/


            // normally this should work:
            try {
                chrome.tabs.query( query, async function(tab) {
                    resolve( tab );
                });
            } catch (e) {
                reject(e);
            }
        })
    },

    /**
     * Looks for current tab url in projects config. if found, rebuilds action menu, badge and other env settings
     * @param tabId
     * @param _debugEventTriggered
     */
    findAndApplyProjectConfigForCurrentTabUrl: function(tabId, _debugEventTriggered) {
        let options = Env.options,
            projectsAll = Env.projectsAll,
            loadFavicon = (_debugEventTriggered === 'onUpdated'  ||  _debugEventTriggered === 'onFocusChanged'),
            loadBadge = (_debugEventTriggered === 'onUpdated'  ||  _debugEventTriggered === 'onFocusChanged');

        if ( Env.tabs_setup[tabId]?.badgeLoaded === true)   {
            loadBadge = false;
        }
        if ( Env.tabs_setup[tabId]?.faviconLoaded === true)   {
            loadFavicon = false;
        }

        Env.logGroup( '=== Match url, preparations', true, tabId );
        Env.log('- PROJECT CONTEXT SETUP begin - find project for current url & rebuild menu', tabId, 0, 2 );


        // gets current tab with details (tab from events only returns id)
        // Env.promiseTabsQuery({active: true, lastFocusedWindow: true})
            // .then( async tabs => {   // let tab = tabs[0] ?? null;
        // we need here this exact tab from which we got here! don't query active tab, user might have switched to another in the meantime!

        Env.promiseTabsGet(tabId)
            .then( async tab => {
                    if ( !tab ) {
                        Env.log( ' ! ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION !', tabId, 3 );
                        Env.log( ' - tabId: ' + tabId + '', tabId, 3, 1 );
                        Env.log( ' - output from .runtime.lastError: ', tabId, 3, 0, chrome.runtime.lastError?.message )
                        Env.log( ' : EXIT / No tab object for some reason', tabId, 1 );
                        // close group again, because here we're on second level nest
                        Env.logGroup( null, null, tabId );
                        Env.helper_finishProjectSetup(tabId, true);
                        Env.consoleLogCustom( ' - Can\'t read tab (system?) - EXIT', Env.consoleColor.FgYellow );
                        return;
                    }

                    if ( !tab.url.toString().startsWith('http') )   {
                        loadFavicon = false;
                        loadBadge = false;
                    }

                    let isProjectFound = false;


                    // setup new ones, if url found in config
                    for ( let p = 0;  p < projectsAll.length;  p++ ) {

                        let project = projectsAll[p];

                        if ( project.hidden || !project.name )
                            continue;


                        if ( typeof project.contexts !== 'undefined' ) {
                            for ( let c = 0;  c < project.contexts.length;  c++ ) {

                                let context = project.contexts[c];

                                if ( context.hidden )
                                    continue;

                                let urlLocal = ''+context?.url; 
                                let urlRemote = ''+tab?.url;

                                if ( options?.env_ignore_www )  {
                                    urlLocal = urlLocal.replace('www\.', '');
                                    urlRemote = urlRemote.replace('www\.', '');
                                }

                                // compare ignoring schema (& trailing slash in context url)
                                if ( urlLocal  &&

                                        // generally use raw tab url, but add trailing slash, in case it's only a domain in tab and we have it
                                        // in config with this slash added. if it's some long url, this slash doesn't do anything bad during comparison
                                        (urlRemote.replace( /\/$/, '' ) + '/')

                                            // match to a pattern made from context url,
                                            .match( new RegExp(

                                                // with leading double slash, with schema stripped,
                                                ('//' + (urlLocal.replace( /^https?:\/\//, '')

                                                    // with one trailing slash,
                                                    .replace( /\/$/, '') ) + '/')

                                                        // with double-escaped slashes and dots,
                                                        .replaceAll( '/', '\\/' )
                                                        .replaceAll( '.', '\\.' )
                                                , 'gmi'     // case-insensitive
                                            ))
                                ) {
                                    isProjectFound = true;
                                    
                                    // close group, then open next on the same level
                                    Env.logGroup(null, false, tabId);
                                    Env.log('* MATCHED URL: '+context.url+'   *****   FOUND PROJECT!', tabId, 2, 0, {project: project.name, context: context.name});
                                    Env.tabs_setup[tabId].projectIsSet = true;

                                    // store found project and context configuration for later use (ie. custom backend path)
                                    Env.tabs_setup[tabId].envConfig = {
                                        'context': context,
                                        'project': project,
                                    };

                                    Env.logGroup( '=== Setup tab for active project [Context]', true, tabId );


                                    Env.log('-- ICON: activate', tabId, 1, 2 );
                                    Env.setActionIcon( 'active', tabId );

                                    // don't check this option - show menu always anyway. no reason to disable it and show only badge.
                                    // also it's problematic due to locks - menu and badge are starting the same time. probably must be done using call chain)
                                    //if ( options.env_switching !== false )  {
                                    Env.setupContextMenu( context, p, project, tabId, _debugEventTriggered );

                                    if ( options.env_badge  &&  loadBadge )  {
                                        Env.log('-- BADGE: inject ', tabId, 1, 2);
                                        Env.setupBadge( context, project, tab, _debugEventTriggered );
                                    }

                                    if ( options.env_favicon  &&  loadFavicon )    {
                                        Env.setupFavicon( context, project, tab, _debugEventTriggered );
                                    }

                                    // stop searching projects, without releasing the lock (release in setup callback)
                                    //Env.helper_finishProjectSetup(tabId);
                                    return;
                                }
                            }
                        }

                        if ( typeof project.links !== 'undefined' ) {
                            for ( let l = 0;  l < project.links.length;  l++ ) {

                                let link = project.links[l];

                                if ( link.hidden )
                                    continue;

                                if ( link.url  &&  tab.url.match( link.url ) ) {

                                    isProjectFound = true;

                                    // close group, then open next on the same level
                                    Env.logGroup(null, false, tabId);
                                    Env.log('* MATCHED URL: '+link.url+'   *****   FOUND PROJECT!', tabId, 2, 0, {project: project.name, link: link.name});
                                    Env.logGroup( '=== Setup tab for active project [Link]', true, tabId );


                                    Env.log('-- ICON: activate', tabId, 1, 2 );
                                    Env.setActionIcon( 'active', tabId );

                                    Env.setupContextMenu( link, p, project, tabId, _debugEventTriggered );

                                    if ( options.env_badge  &&  loadBadge )  {
                                        link.color = '#cccccc';
                                        Env.log('-- BADGE: inject ', tabId, 1, 2);
                                        Env.setupBadge( link, project, tab, _debugEventTriggered );
                                    }
                                    
                                    // no favicon overlay on Links

                                    // stop searching projects, without releasing the lock (release in setup callback)
                                    //Env.helper_finishProjectSetup(tabId);
                                    return;
                                }
                            }
                        }
                    }

                    // deactivate icon
                    // good place for this - later = avoids icon blink
                    Env.log( '-- ICON: deactivate', tabId, 0, 2 );
                    Env.setActionIcon( '', tabId );

                    Env.logGroup(null, false, tabId);
                    Env.log('- project NOT FOUND.', tabId, 1, 0);
                    Env.logGroup( '=== Setup tab', true, tabId );
                    Env.log( '-- MENU: standard menu items, All Projects, custom links, if enabled', tabId );

                    // if project not found, build standard menu
                    Env.setupContextMenu( [], '', [], tabId, _debugEventTriggered );
                    // check if not better close group before menu build, it may take time and mix console logs
        });
    },


    /**
     * Add to submenu all contexts of a project
     * @param activeContext
     * @param p - project's array index
     * @param project
     * @param tabId
     * @param _debugEventTriggered
     */
    setupContextMenu: function(activeContext, p, project, tabId, _debugEventTriggered) {

        Env.log('-- MENU: rebuild', tabId, 0, 1);

        let menuItems = [];
        let mark = '';
        let options = Env.options;

        // clear current options again / to be sure it's empty before adding anything
        // (because for some strange reason, it's usually not...)
        chrome.contextMenus.removeAll(() => { 
        
        
            // New permissions info     // todolater: delete in a few minor version

            //   When the ext was just updated to a version with the new host-permissions, it won't work until the permissions are granted.
            //   We need to inform the user about that situation and let him go to the options and save them to trigger permission check.
            //
            //   Here we show the info as an additional position in ext menus (only for current users after update, with stored projects / urls
            //   for which we need to request for that permission.)


            // display info as temporary menu position about needed actions - to make user see this when tries to first use updated Switcher, which will not work yet -
            // it will show the message on an existing initiated project and points to options screen
            // won't show to new users (identify by empty options storage), if no project is currently set, or if ..._acknowledged = true)
            if ( /*typeof project.uuid !== 'undefined'    // we don't have all projects array here, but this way we can check if some project is currently set in this tab 
                    &&*/  options.env_enable      // check existence of one of basic config options - if no such, it means user wasn't in option yet and is a new user
                    &&  ! options.internal_permissions_acknowledged )  {


                let tempMenuContexts = [ 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'page_action', 'action' ];
                chrome.contextMenus.create({
                    title:      '!!!  IMPORTANT  !!!  Your attention needed - open Options / SEE DETAILS ->',
                    contexts:   tempMenuContexts,
                    id:         'TEMP-message_perms'
                });
                chrome.contextMenus.create({
                    title:      'TEMP-message_perms_separator',
                    id:         'TEMP-message_perms_separator',
                    contexts:   tempMenuContexts,
                    type:       'separator',
                });
            }





            // -- ENVIRONMENTS (CONTEXTS)
            if ( typeof project.contexts !== 'undefined' ) {

                let contextSubmenuAdded = false,
                    c = 0;

                for ( c;  c < project.contexts.length;  c++ ) {
                    let context = project.contexts[c];

                    if ( context.hidden || !context.url || !context.name )
                        continue;

                    // if any not hidden contexts, add context submenu (on first occurance)
                    if ( !contextSubmenuAdded )    {

                        menuItems.push({
                            title:              project.name + ': contexts',
                            id:                 'parent_contexts',
                            showForMenuType:    'actionMenuOnly'
                        });
                        contextSubmenuAdded = true;
                    }

                    mark = activeContext.name === context.name  &&  activeContext.url === context.url ? '-> ' : '     ';

                    menuItems.push({
                        title:              mark + context.name,
                        id:                 'project-' + p + '-env-' + c,
                        parentId:           'parent_contexts',
                        showForMenuType:    'actionMenuOnly'
                    });
                    menuItems.push({
                        title:              mark + context.name,
                        id:                 'project-' + p + '-env-' + c,
                        showForMenuType:    'rightClickOnly'
                    });
                }
            }


            // -- LINKS
            if ( typeof project.links !== 'undefined' ) {

                let separatorAdded = false;
                let linksSubmenuAdded = false;
                let l = 0;

                for ( l;  l < project.links.length;  l++ ) {

                    let link = project.links[l];

                    if ( link.hidden || !link.url || !link.name)
                        continue;

                    // if any not hidden links, add context submenu (on first occurance)
                    if ( !linksSubmenuAdded ) {
                        menuItems.push({
                            title:              project.name + ': links',
                            id:                 'parent_links',
                            showForMenuType:    'actionMenuOnly'
                        });
                        linksSubmenuAdded = true;
                    }

                    mark = activeContext.name === link.name  &&  activeContext.url === link.url  ?  '-> '  :  '     ';

                    // add separator on first (not hidden) item
                    if ( !separatorAdded ) {
                        menuItems.push({
                            // for action icon where we use submenus, we set parentId - in that case this separator is not used.
                            // it's only for page context menu, where we don't use additional submenus
                            title:             '_separator-links',      // needed to not cause error later in iteration
                            id:                'separator_links',       // needed to not cause error later in iteration
                            type:              'separator',
                            showForMenuType:   'rightClickOnly'
                        });
                        separatorAdded = true;
                    }

                    menuItems.push({
                        title:              mark + link.name,
                        id:                 'project-' + p + '-link-' + l,
                        parentId:           'parent_links',
                        showForMenuType:    'actionMenuOnly'
                    });
                    menuItems.push({
                        title:              mark + link.name,
                        id:                 'project-' + p + '-link-' + l,
                        showForMenuType:    'rightClickOnly'
                    });
                }
            }


            menuItems.push({
                title:             '_separator-shortcustom',
                id:                'separator_shortcustom',
                type:              'separator',
                showForMenuType:   'rightClickOnly'
            });


            // -- Custom shortcut 1
            if ( options.env_menu_short_custom1  &&  options.env_menu_short_custom1 !== '' ) {
                let linkParts_short1 = options.env_menu_short_custom1.split(' | ');

                menuItems.push({
                    title:      linkParts_short1[1] ?? linkParts_short1[0],
                    id:         'project-' + p + '-shortcustom-1'
                });
            }


            // -- Custom shortcut 2
            if ( options.env_menu_short_custom2  &&  options.env_menu_short_custom2 !== '' ) {
                let linkParts_short2 = options.env_menu_short_custom2.split(' | ');

                menuItems.push({
                    title:      linkParts_short2[1] ?? linkParts_short2[0],
                    id:         'project-' + p + '-shortcustom-2'
                });
            }


            // -- ALL PROJECTS
            if ( options.env_menu_show_allprojects ) {
                let separatorAdded = false;

                menuItems.push({
                    title:      'All projects',
                    id:         'allprojects',
                });

                // iterate all projects and links
                
                for ( let _p = 0;  _p < Env.projectsAll.length;  _p++ ) {
                    let _project = Env.projectsAll[_p];

                    if ( _project.hidden || !_project.name )
                        continue;
                    menuItems.push({
                        title:             _project.name,
                        id:                'allprojects_project-' + _p,
                        parentId:          'allprojects',
                    });
                    if ( typeof _project.contexts !== 'undefined' ) {
                        for ( let _c = 0;  _c < _project.contexts.length;  _c++ ) {
                            let _context = _project.contexts[_c];
                            if ( _context.hidden || !_context.url || !_context.name )
                                continue;

                            menuItems.push({
                                title:             _context.name,
                                id:                'allprojects_project-' + _p + '-env-' + _c,
                                parentId:          'allprojects_project-' + _p,
                            });
                        }
                    }

                    if ( typeof _project.links !== 'undefined' ) {
                        separatorAdded = false;
                        for ( let _l = 0;  _l < _project.links.length;  _l++ ) {
                            let _link = _project.links[_l];
                            if ( _link.hidden || !_link.url || !_link.name )
                                continue;
                            
                            // add separator on first (not hidden) item
                            if ( !separatorAdded ) {
                                menuItems.push({
                                    title:             '_separator-links',
                                    id:                'allprojects_project-' + _p + '-separator-links',
                                    parentId:          'allprojects_project-' + _p,
                                    type:              'separator',
                                });
                                separatorAdded = true;
                            }

                            menuItems.push({
                                title:             _link.name,
                                id:                'allprojects_project-' + _p + '-link-' + _l,
                                parentId:          'allprojects_project-' + _p,
                            });
                        }
                    }
                }
            }


            menuItems.push({
                title:              '_separator-tools',
                id:                 'separator_tools',
                type:               'separator',
                showForMenuType:    'rightClickOnly'
            });

            // additional tools submenu
            menuItems.push({
                title:              'Tools',
                id:                 'tools',
                showForMenuType:    'actionMenuOnly',
            });
            menuItems.push({
                title:              'Add/Edit current URI',
                id:                 'tool--add_edit',
                parentId:           'tools',
                showForMenuType:    'actionMenuOnly',
            });
            menuItems.push({
                title:              'Add/Edit current URI',
                id:                 'tool--add_edit',
                showForMenuType:    'rightClickOnly',
            });
            menuItems.push({
                title:              'Options',
                id:                 'tool--options',
                showForMenuType:    'rightClickOnly',
            });
            
            // assume it's firefox - add Options to icon menu - it's not there by default like in chrome
            if ( typeof browser !== 'undefined' ) {
            // if ( Env.engine === 'gecko' ) {
                menuItems.push({
                    title:              'Options',
                    id:                 'tool--options',
                    parentId:           'tools',
                    showForMenuType:    'actionMenuOnly',
                });
            }


            // when item array ready,
            // BUILD THE MENU


            Env.log('--- MENU ITEMS: ', tabId, 1, 1, menuItems);

            let menuCallback;

            // set up context menu
            for ( let i = 0;  i < menuItems.length;  i++ ) {


                // on last item
                if ( i === menuItems.length - 1 ) {

                    menuCallback = function () {
                            if ( chrome.runtime.lastError ) {
                                Env.log('Warn: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered, tabId, 3, 0 );
                                Env.log('menu pos: ', tabId, 3, 0, menuItems[i] );
                                Env.log(chrome.runtime.lastError.message, tabId, 3, 0);
                            }

                            Env.log('--- MENU: Successfully built', tabId, 0, 2);

                            // LOCK RELEASE, end group, end top group, output collected log
                            Env.logGroup(null, false, tabId);
                            Env.helper_finishProjectSetup(tabId, true);
                            Env.consoleLogCustom('== * DONE - tab handle end - EXIT [LOCK RELEASE]', Env.consoleColor.FgGreen, tabId );
                    };
                }
                else    {
                    menuCallback = function () {
                            if ( chrome.runtime.lastError ) {
                                Env.log('Warn: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered, tabId, 3, 0 );
                                Env.log(chrome.runtime.lastError.message, tabId, 2, 0);
                            }
                    };
                }



                // ACTION ICON MENU

                // don't show items dedicated only to right-click menu (like separators, when no submenus used there)
                if ( menuItems[i]?.showForMenuType !== 'rightClickOnly' )  {

                    chrome.contextMenus.create({
                            title:      menuItems[i].title,
                            contexts:   [ 'action' ],
                            id:         'ICON-'+menuItems[i].id,
                            type:       menuItems[i]?.type === 'separator'
                                ? 'separator'
                                : 'normal',
                            parentId:   menuItems[i]?.parentId
                                ? 'ICON-'+menuItems[i].parentId
                                : null
                        },
                        menuCallback
                    );
                }

                // PAGE RIGHT-CLICK MENU

                if ( menuItems[i]?.showForMenuType !== 'actionMenuOnly' )  {

                    chrome.contextMenus.create({
                            title:      menuItems[i].title,
                            contexts:   [ 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'page_action' ],
                            id:         'RIGHT-'+menuItems[i].id,
                            type:       menuItems[i]?.type === 'separator'
                                ? 'separator'
                                : 'normal',

                            parentId:   menuItems[i]?.parentId
                                ? 'RIGHT-'+menuItems[i].parentId
                                : null
                        },
                        menuCallback
                    );
                }
        }
        
        // /end of second menu cleanup
        });
    },


    /**
     * Inject badge script with it's settings into current tab source
     * @param context (actually, now it may be Context or Link)
     * @param project
     * @param tab
     * @param _debugEventTriggered
     */
    setupBadge: function (context, project, tab, _debugEventTriggered) {

        if ( !tab.url.toString().startsWith('http') )   {
            return Env.log('Env.setupBadge(): tab url is not http type (probably system page). Exit', tab.id, 0, 2);
        }

        if ( !context.color )   {
            return Env.log('Env.setupBadge(): color not set. project / context: \n'+ project.name +' / '+context.name, tab.id, 3, 0);
        }
        
        Env.tabs_setup[tab.id].badgeLoaded = true;


        // 1st include the lib, then after - pass the code which calls the object with passed params 
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['setBadge.js']
        }).then(() => {

            // on system pages you can't inject any scripts
            if ( chrome.runtime.lastError ) {
                Env.log('Error injecting badge script: \n' + chrome.runtime.lastError.message, tab.id, 1, 1);
            } else  {

                let argumentsToInject = {
                    DEV: Env.DEV,
                    DEBUG: Env.DEBUG,
                    projectLabel: project.name,
                    contextLabel: context.name,
                    contextColor: context.color,
                    projectLabelDisplay: ( typeof Env.options.env_badge_projectname === 'undefined'  ||  Env.options.env_badge_projectname === true  ?  'true'  :  'false' ),
                    scale: ( typeof Env.options.env_badge_scale !== 'undefined'  ?  parseFloat( Env.options.env_badge_scale )  :  1.0 ),
                    position: ( typeof Env.options.env_badge_position !== 'undefined'  ?  Env.options.env_badge_position  :  'left' ),
                    _debugEventTriggered: _debugEventTriggered,
                };
                Env.log('------- setBadge.js injected! arguments to pass: ', argumentsToInject, 1, 1);

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (_incoming_params) => {
                        if (_incoming_params?.DEBUG > 1) {
                            console.info('Injected badge params: ', _incoming_params);
                            console.log('typeof Badge', typeof Badge);
                        }
                        Badge.setBadge(_incoming_params);
                    },
                    args: [argumentsToInject],
                }, () => {
                    // on system pages you can't inject any scripts
                    if (chrome.runtime.lastError) {
                        Env.log('Env.setupBadge(): Error injecting CODE/params: \n' + chrome.runtime.lastError.message, tab.id, 3, 1);
                    } else {
                        Env.log('Env.setupBadge(): badge_params script injected', tab.id, 0, 1, argumentsToInject);
                    }
                });
            }
        });
    },


    /**
     * Inject favicon script with it's settings into current tab source
     * @param context (actually, now it may be Context or Link)
     * @param project
     * @param tab
     * @param _debugEventTriggered
     */
    setupFavicon: function (context, project, tab, _debugEventTriggered) {
        
        if ( !tab.url.toString().startsWith('http') )   {
            return Env.log('Env.setupFavicon(): tab url is not http type (probably system page). Exit', tab.id, 0, 2);
        }

        if ( !context.color )   {
            return Env.log('Env.setupFavicon(): color not set. project / context: \n' + project.name + ' / ' + context.name, tab.id, 3, 0);
        }
        
        Env.tabs_setup[tab.id].faviconLoaded = true;

        // 1st include the lib, then after - pass the code which calls the object with passed params 
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['setFavicon.js']
        }).then(() => {
            
            // on system pages you can't inject any scripts
            if ( chrome.runtime.lastError ) {
                Env.log('Error injecting favicon script: \n' + chrome.runtime.lastError.message, tab.id, 1, 1);
            } else  {

                let argumentsToInject = {
                    DEV: Env.DEV,
                    DEBUG: Env.DEBUG,
                    contextColor: context.color,
                    alpha: ( typeof Env.options.env_favicon_alpha !== 'undefined'  ?  parseFloat( Env.options.env_favicon_alpha )  :  0.85 ),
                    fill: ( typeof Env.options.env_favicon_alpha !== 'undefined'  ?  parseFloat( Env.options.env_favicon_fill )  :  0.25 ),
                    position: ( typeof Env.options.env_favicon_position !== 'undefined'  ?  Env.options.env_favicon_position  :  'bottom' ),
                    composite: ( typeof Env.options.env_favicon_composite !== 'undefined'  ?  Env.options.env_favicon_composite  :  'source-over' ),
                    _debugEventTriggered: _debugEventTriggered,
                };
                Env.log('------- setFavicon.js injected! arguments to pass: ', argumentsToInject, 1, 1);

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (_incoming_params) => {
                        if (_incoming_params?.DEBUG > 2) {
                            console.info('Injected favicon params: ', _incoming_params);
                            console.log('typeof Favicon', typeof Favicon);
                        }
                        Favicon.setFavicon(_incoming_params);
                    },
                    args: [argumentsToInject],
                }, () => {
                    // on system pages you can't inject any scripts
                    if (chrome.runtime.lastError) {
                        Env.log('Env.setupFavicon(): Error injecting CODE/params: \n' + chrome.runtime.lastError.message, tab.id, 3, 1);
                    } else {
                        Env.log('Env.setupFavicon(): favicon_params script injected', tab.id, 0, 1, argumentsToInject);
                    }
                });
            }
        });
    },


    /**
     * Switch to selected context environment - open tab with current subpage and different host
     * @param newContext
     * @param activeContext
     * @param project
     */
    switchEnvironment : function(newContext, activeContext, project) {

        console.log(':: SWITCH ENV!');
        //console.log(newContext);
        //console.log(activeContext);

        // params2.pageUrl is a key in object passed to this func? not passed, so get it
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let _currentTab = tabs[0],
                newTabUrl = '';

            // if we are on project's link, not context, we may not get activeContext
            if ( typeof activeContext !== 'undefined'  &&  typeof activeContext.url !== 'undefined' )  {
                // strip trailing slash
                let activeContextBaseUrl = activeContext.url.replace( /\/$/, '' ),
                    newContextBaseUrl = newContext.url.replace( /\/$/, '' );

                console.log('active url: ' + activeContextBaseUrl);
                console.log('target url: ' + newContextBaseUrl);

                newTabUrl = _currentTab.url.replace( activeContextBaseUrl, newContextBaseUrl );
            }
            else    {
                newTabUrl = newContext.url;
            }

            Env.consoleLogCustom(':: OPEN TAB [ENV] & EXIT: ' + newTabUrl, Env.consoleColor.FgMagenta );
            console.groupEnd();

            // open new context in new tab
            // todo: option to choose whether to open context in new tab, or replace (maybe checkbox in menu?)
            chrome.tabs.create({
                'url' :     newTabUrl,
                'index' :   _currentTab.index + 1
            });
        });
    },


    /**
     * Set action icon on chrome's bar
     * @param type
     * @param tabId
     */
    setActionIcon : function (type, tabId) {

        // set icon only when tab is set for the first time
        /*if (!tabId)
            return;*/

        switch (type)   {
            case 'active':
                chrome.action.setIcon({
                    path : 'Icons/icon-48-act.png',
                    tabId: tabId
                });
                break;

            default:
                chrome.action.setIcon({
                    path : 'Icons/icon-48.png',
                    tabId: tabId
                });
        }
    },


    /**
     * Bind menu clicks listeners to catch and handle them, basing on configuration
     */
    listenMenuClicks: function ()   {

        if ( Env.options?.env_enable !== true ) {
            return console.log('EXIT: ------ Switcher: ENV functionality disabled ------');
        }

        /**
         * Handle menu items onclick (the only way to pass params)
         */
        chrome.contextMenus.onClicked.addListener(function(info, tab) {

            // console.log(info);
            // console.log(tab);

            /** syntax:
                    clickSrc-itemType-itemIndex-itemSubType-itemSubIndex
                examples:
                    ICON-project-20-link-3,
                    ICON-allprojects_project-4
                    RIGHT-shortcustom-4-shortcustom-2
                    ICON-tool--addedit
             */

            // extract necessary info from button id
            let idParts = info?.menuItemId?.split(/-/),
                itemType = idParts[1],
                itemIndex = idParts[2],
                itemSubType = idParts[3],
                itemSubIndex = idParts[4];

            console.groupCollapsed('Open tab. Menu position params:');
            console.log('idParts split: ', idParts);
            console.log('Link params parsed: ', {clickSrc: idParts[0], itemIndex: itemIndex, itemType: itemType, itemSubType: itemSubType, itemSubIndex: itemSubIndex});



            // menu position: TEMPORARY MESSAGE / go to options

            if ( itemType === 'message_perms' )   {
                console.info(':: OPEN OPTIONS & EXIT');
                console.groupEnd();

                chrome.tabs.create({
                    'url':     'options.html',
                    'index':   tab.index + 1
                });
                return;
            }



            // menu position: TOOLS

            if ( itemType === 'tool'  &&  itemSubType === 'add_edit' )   {
                console.info(':: OPEN OPTIONS & EXIT');
                console.groupEnd();

                // store current page url
                chrome.tabs.query( {active: true, currentWindow: true}, tabs => {
                    let tab = tabs[0];
                    chrome.storage.local.set({ 'urlAddEdit': tab.url }, () => {

                        // open options screen and handle that uri there
                        chrome.tabs.create({
                            'url':     'options.html',    // 'chrome-extension://'+chrome.runtime.id+'/options.html',
                            'index':   tab.index + 1
                        });
                    });
                });
                return;
            }

            if ( itemType === 'tool'  &&  itemSubType === 'options' )   {
                console.info(':: OPEN OPTIONS & EXIT');
                console.groupEnd();

                // open options screen (I don't know other way to have this shorthand somewhere)
                chrome.tabs.create({
                    'url':     'options.html',
                    'index':   tab.index + 1
                });
                return;
            }


            // handle project-related items

            let project = Env.projectsAll[ itemIndex ] ?? {};
            if ( Env.DEBUG > 0 )    {
                console.log('Project: ', project);
                console.log(itemSubType);
            }

            if ( typeof project === 'undefined'  &&  itemSubType !== 'shortcustom')   {
                console.groupEnd();
                return;
            }


            if ( itemType === 'allprojects_project' )  {

                if ( itemSubType === 'env'  &&  project.contexts[ itemSubIndex ] )    {
                    console.info(':: OPEN TAB [allprojects: '+project.name+', env: '+project.contexts[ itemSubIndex ].name+'] & EXIT: ' + project.contexts[ itemSubIndex ].url);
                    chrome.tabs.create({
                        'url' :     project.contexts[ itemSubIndex ].url,
                        'index' :   tab.index + 1
                    });
                }
                else if ( itemSubType === 'link'  &&  project.links[ itemSubIndex ] )    {
                    console.info(':: OPEN TAB [allprojects: '+project.name+', link: '+project.links[ itemSubIndex ].name +'] & EXIT: ' + project.links[ itemSubIndex ].url);
                    chrome.tabs.create({
                        'url' :     project.links[ itemSubIndex ].url,
                        'index' :   tab.index + 1
                    });
                }

                console.groupEnd();
                return;
            }



            // menu position: LINK

            if ( itemType === 'project'  &&  itemSubType === 'link'  &&  project.links[ itemSubIndex ] )  {
                //console.log(project.links[ itemIndex ]);
                console.info(':: OPEN TAB [LINK] & EXIT: ' + project.links[ itemSubIndex ].url);
                console.groupEnd();

                chrome.tabs.create({
                    'url' :     project.links[ itemSubIndex ].url,
                    'index' :   tab.index + 1
                });
                return;
            }


            // menu position: ENV / CONTEXT
            // menu position: CUSTOM SHORTCUTS


            chrome.tabs.query( {active: true, currentWindow: true}, function(tabs) {
                let tab = tabs[0];
                //console.log(tab);

                let activeContext = {};

                // look for current context (for base url replace)
                if ( typeof project.contexts !== 'undefined' )    {
                    for ( let c = 0;  c < project.contexts.length;  c++ ) {

                        let context = project.contexts[c];

                        if ( context.url  &&  tab.url.match( context.url ) )  {
                            activeContext = context;
                            console.log(':: PRE-SWITCH: active context found');
                            console.groupEnd();
                        }
                    }
                }

                if ( itemSubType === 'shortcustom' ) {
                    switch ( itemSubIndex ) {
                        case '1':   return Switcher.openCustomShortcut( activeContext.url ?? '', Env.options?.env_menu_short_custom1, '1' );
                        case '2':   return Switcher.openCustomShortcut( activeContext.url ?? '', Env.options?.env_menu_short_custom2, '2' );
                    }
                }

                let newContext = project.contexts[ itemSubIndex ];

                if ( typeof newContext === 'undefined'  &&  itemSubType !== 'shortcustom' ) {
                    console.warn('error - no such context set in menu? context index: ' + itemSubIndex);
                    console.groupEnd();
                    return;
                }


                if ( newContext === activeContext )   {
                    console.log(':: PRE-SWITCH: current context clicked: do nothing');
                    console.groupEnd();
                    return;
                }

                // console.log(newContext);
                // console.log(activeContext)

                Env.switchEnvironment( newContext, activeContext, project );
            });
        });
    },



    // todo later: move these to some helper or somewhere

    LEVEL_debug: -1,
    LEVEL_log: 0,
    LEVEL_info: 1,
    LEVEL_success: 2,
    LEVEL_warn: 3,
    LEVEL_error: 4,

    /**
     * Store log messages in collection, console.log if needed (in debug mode)
     * @param msg string
     * @param tabId int, Basically a key for grouping logs
     * @param severityLevel int [-1-4], Default 0 (log)     (blue - purple - yellow[warn] - red[error], 0 = white, -1 = debug?)
     * @param logDetailLevel int, Higher number allows not to see it, unless debugLevel >= logLevel. 0 [default] = show always [todo]
     * @param variable <misc>, Variable to log
     * @param forceOutput bool - For exceptions and other errors
     */
    log: function (msg, tabId, severityLevel, logDetailLevel, variable, forceOutput)   {

        logDetailLevel = logDetailLevel ?? 0;
        severityLevel = severityLevel ?? 0;
        let key = tabId ?? '_general_log';
        // make sure array key exist
        Env.tabs_log[key] = Env.tabs_log[key] ?? [];
        // collect in array to output later
        Env.tabs_log[key].push( Object.assign({
                msg: msg,
                severity: severityLevel,
                logLevel: logDetailLevel,
            }, ( variable ? {variable: variable} : {} ) ));
        // output instantly?
        if ( 0 && Env.DEV  &&  Env.DEBUG >= logDetailLevel )  {
            Env.consoleLog(msg, severityLevel, variable);
            if ( severityLevel > 1 )    {
                console.groupCollapsed(' (Trace)');
                console.trace();
                console.groupEnd();
            }
        }
    },
    
    /**
     * Add to collection group indicator, which will result in console group
     * @param label string - if set, it will be group opening, otherwise - closing
     * @param collapsed
     * @param tabId int
     */
    logGroup: function (label, collapsed, tabId)   {
        let key = tabId ?? '_general_log';
        // make sure array key exist
        Env.tabs_log[key] = Env.tabs_log[key] ?? [];
        
        // collect in array to output later
        Env.tabs_log[key].push({
                msg: label,
                group: label ? 'open' : 'close',
                collapsed: collapsed,
        });
        // output instantly?
        if ( 0 && Env.DEV  &&  Env.DEBUG >= logDetailLevel )  {
            if (label)  
                if (collapsed)
                    console.groupCollapsed(label ?? 'Group');
                else
                    console.group(label ?? 'Group');
            else
                console.groupEnd();
        }
    },

    /**
     * Output collected log items at once to console (to have them grouped)
     */
    printLogs: function (key)  {
        //console.log(Env.tabs_log[key]); return;
        Object.entries(Env.tabs_log[key] ?? []).forEach(function([i, row])    {
            if ( (Env.DEBUG >= row.logLevel) || row?.group/* || Env.DEV */) {
                if (row?.group)     {
                    switch (row.group) {
                        case 'open':
                            if (row?.collapsed)
                                console.groupCollapsed(row.msg);
                                // console.group(row.msg);
                            else
                                console.group(row.msg);
                            break;
                        case 'close':
                            console.groupEnd();
                            break;
                    }
                    return;
                }

                Env.consoleLog(row.msg, row.severity, row.variable);
            }
        });
        // remove item from log after output
        Env.tabs_log[key] = [];
    },
    
    /**
     * Direct console.log colored output
     */
    consoleLog: function (msg, severity, variable)  {
        let colors = Env.consoleColor;
        if ( Env.engine === 'webkit' )  {
            switch (severity)  {
                case -1:  variable  ?  console.debug(colors.FgWhite + msg, variable)  :  console.debug(colors.FgWhite + msg, variable); break;
                case 0:   variable  ?  console.log(colors.FgWhite + msg, variable)  :  console.log(colors.FgWhite + msg); break;
                case 1:   variable  ?  console.info(colors.FgCyan + msg, variable)  :  console.info(colors.FgCyan + msg); break;
                case 2:   variable  ?  console.info(colors.FgMagenta + msg, variable)  :  console.info(colors.FgMagenta + msg); break;
                case 3:   variable  ?  console.warn(colors.FgYellow + msg, variable)  :  console.warn(colors.FgYellow + msg); break;
                case 4:   variable  ?  console.error(colors.FgRed + msg, variable)  :  console.error(colors.FgRed + msg); break;
            }
        } else  {
            switch (severity)  {
                case -1:  variable  ?  console.debug("%c"+ msg, colors.FgWhite, variable)  :  console.debug(colors.FgWhite + msg, variable); break;
                case 0:   variable  ?  console.log("%c"+ msg, colors.FgWhite, variable)  :  console.log("%c"+ msg, colors.FgWhite); break;
                case 1:   variable  ?  console.info("%c"+ msg, colors.FgCyan, variable)  :  console.info("%c"+ msg, colors.FgCyan); break;
                case 2:   variable  ?  console.info("%c"+ msg, colors.FgMagenta, variable)  :  console.info("%c"+ msg, colors.FgMagenta); break;
                case 3:   variable  ?  console.warn("%c"+ msg, colors.FgYellow, variable)  :  console.warn("%c"+ msg, colors.FgYellow); break;
                case 4:   variable  ?  console.error("%c"+ msg, colors.FgRed, variable)  :  console.error("%c"+ msg, colors.FgRed); break;
            }
        }
    },
    
    /**
     * Additional CL for cross-browser custom color direct log
     */
    consoleLogCustom: function (msg, color, variable)  {
        if ( Env.engine === 'webkit' )  {
            variable  ?  console.log(color + msg, variable)  :  console.log(color + msg);
        } else  {
            variable  ?  console.log("%c"+ msg, color, variable)  :  console.log("%c"+ msg, color);
        }
    },

    /**
     * Usually finishes + closes console group, but can also take down the lock, finishing whole process
     * @param tabId int
     * @param unlock bool
     */
    helper_finishProjectSetup: function (tabId, unlock) {
        if (unlock) {
            Env.log( '[UNLOCK]', tabId, 1, 0);
            if (typeof Env.tabs_setup[tabId] === 'undefined')   {   // for some weird reason, sometimes it may be null at that stage
                Env.tabs_setup[tabId] = {};
            }
            Env.tabs_setup[tabId].lock = false;
        }
        Env.logGroup( null, false, tabId );
        if ( Env.tabs_setup[tabId]?.projectIsSet )   {
            Env.log( '[Project was found and is set]', tabId, 2, 0);
        }
        Env.printLogs( tabId );
        Env.printLogs( '_general_log' );    // print also this one, after group close
    },
};



/*
 * Some on-start stuff
 */
Env.init();



/*
 * The whole magic
 */


async function initTheMagic() {

    await Env.promiseConfig()
        .then( options => Env.setupOptions( options ) )
        .then( () => Env.bindProjectDetection() )
        .then( () => Env.listenMenuClicks() )
        .catch( e => Env.consoleLog(e, 4) );

    //throw 'some error';
    // classic try..catch doesn't work for async!
}
initTheMagic()
    .catch( (e) => Env.consoleLog(e, 4) );



    



