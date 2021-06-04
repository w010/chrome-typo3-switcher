/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017-2021
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Context menu script - switching projects between its environments
 * Icon submenu, page submenu, info badges
 *
 * (Note, that 'contextMenus' for chrome means 'right click on context', where 'context' means where it's clicked.
 * - And for us the 'context' (or environment) means the server, where the project runs.
 * It's important in this file, where the context menu are set up. Please remember this and don't mix them!)
 */

// console.log('environment.js loaded');


            // to za bardzo nie dziala
            // https://stackoverflow.com/questions/50844405/how-do-i-use-promises-in-a-chrome-extension
            /*function toPromise(api) {
              return (...args) => {
                return new Promise((resolve) => {
                  api(...args, resolve);
                });
              };
            }*/
            /*toPromise(chrome.tabs.query)({active: true, currentWindow: true}).then(function(t){
                console.log(t);
            });*/
    
    
        /*  z tego cos sklepalem
        
        async function promiseQuery(options){
          return new Promise(function(resolve,reject){
            chrome.tabs.query(options, resolve);
          });
        }
        
        function getTabID() {
            return new Promise((resolve, reject) => {
                try {
                    chrome.tabs.query({
                        active: true,
                    }, function (tabs) {
                        resolve(tabs[0].id);
                    })
                } catch (e) {
                    reject(e);
                }
            })
        }
        
        //function where you need it
        async function something() {
            let responseTabID = await getTabID();
            console.log(responseTabID);
        }
        
        something();
        */



let Env = {

    // level of log details etc.
    DEV: 2,
    // see more info in critical situations 
    DEBUG: 1,

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
     * Read config + preprocess projects array
     * @return {Promise<unknown>}
     */
    promiseConfig: function() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get( null, function(options) {
                    
                    // exit now, if whole env functionality is disabled
                    if ( options?.env_enable !== true )
                    {
                        reject('EXIT: ------ \'Switcher: ENV functionality disabled\' ------');
                    }

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
        Env.DEV = options.ext_debug;
        let projects = [];

        // recent raw js method to foreach
        Object.entries(options).forEach(function([key, value])    {
            if (key.match(/^project_/g)) {
                // if, for some reason, project doesn't have a uuid, take it from key (probably uuid is not needed here, but keep the code in sync with Options) 
                if (typeof options[key].uuid === 'undefined')
                    options[key].uuid = key.replace(/^project_+/g, '');
                projects.push(options[key]);
            }
        });
        // put them in right order
        projects.sort(function(a, b){
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
        
        let console_setupStartDivider = (triggerEventInfo) => {
            console.info('');
            console.info('=============  ENVIRONMENT SETUP  '+ triggerEventInfo +'  =============');
        }
            /*  do the whole job on these specified events hit, to reinit the menu etc. every time in current window a tab
                is switched / page is loaded in current tab / - basically when current window's content / viewport / url changes
                we rebuild the menu and replace the action icon indicator   */
            /*  try these
                chrome.tabs.onHighlightChanged.addListener( function (highlightInfo) {
                [works bad]
                this one: chrome.tabs.onSelectionChanged.addListener( function (tabId, selectInfo) can't be used here, it have to run on tab focus */


        // on SWITCH TAB
        chrome.tabs.onHighlighted.addListener( function (highlightInfo) {

            console_setupStartDivider(' --  event: TAB SWITCHED  --  [tabs.highlightInfo]');
            let tabId = highlightInfo?.tabIds[0] ?? 0;
            
            if (!tabId) {
                return console.log('- ERROR - no tabId from onHighlighted... highlightInfo. ');
            }
            if ( Env.tabs_setup[tabId]?.lock )   {
                return console.log( '== : LOCKED - operation in progress. - EXIT.' );
            }
            
            // START SETUP

            // reset previous data stored for this tab
            Env.tabs_setup[tabId] = {};
            Env.tabs_log[tabId] = [];

            // set lock
            Env.logGroup( '== SETUP TAB id = '+tabId, true, tabId );
            Env.log( '[LOCK]', tabId, 0, 0 );
            Env.tabs_setup[tabId].lock = true;

// TODO: CAN WE REUSE THIS PART?

            Env.promiseTabsGet(tabId)
                .then( async (tab) => {
                    Env.log('* Got Tab object - START ->>>', tabId, 0, 1 );
                    Env.log('- TAB object', tabId, Env.LEVEL_debug, 2, tab );

                    // ! in that bug situation it doesn't fail, it just returns undefined in success-way!
                    if (typeof tab === 'undefined') {
                        Env.log( ' ! ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION !', tabId, 3 );
                        Env.log( ' - tabId: ' + tabId + ' highlightInfo', tabId, 2, 1, highlightInfo );
                        Env.log( ' - output from .runtime.lastError: ' + chrome.runtime.lastError.message, tabId, 2, 0 )
                        Env.log( ' : EXIT / No tab object for some reason', tabId, 1 );
                        Env.helper_finishProjectSetup(tabId, true);
                        return;
                    }

                                // on system and other pages which are not simply http website, end execution
                                // update: this idea failed, but after recent tests I think it's unnecessary, works well 
                                /*if ( !tab.url.toString().startsWith('http') )   {
                                    console.log( ': - applies only to http/s schema urls.' );
                                    console.groupCollapsed('Cleanup / reset');
                                    Env.lock = true;
                                    console.info('-- ICON: deactivate');
                                    Env.setActionIcon( '', tabId );
                                    console.log('-- MENU: clean.');
                                    chrome.contextMenus.removeAll( function () {
                                        console.log('-- MENU: rebuild with universal items.');
                                        // setup menu with universal items
                                        Env.setupContextMenu( [], -1, [], tabId, 'onHighlighted' );
                                        console.log( ': EXIT' );
                                    });
                                    return;
                                }*/


                    // check if completed and if not - delay execution (don't loop checking this, better try to load it anyway after a while.
                    // this way it should fix missing favicon/badge problem, but doesn't make you wait every time until all assets finishes loading
                    // until the badge finally displays.) todo: observe the new behaviour, revert in case of problems
                    if ( tab?.status === 'loading' )   {
                        Env.log( ': PAGE IS STILL LOADING - delay project init', tabId, 2, 1 );
                        setTimeout(function(){
                            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted', tabId );
                        }, 500);
                    }
                    else    {
                        Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted', tabId );
                    }
                })
                .catch( (e) => console.log(e) );
        });




        // on SWITCH WINDOW

        // (focus window with some tab open doesn't hit any event on this tab, so we need this also) 
        chrome.windows.onFocusChanged.addListener( function (windowId) {
console.log('  # # # # # # #    FOCUS CHANGED - DO WE NEED TO USE THIS LISTENER? ');
return;
            console_setupStartDivider(' --  event: WINDOW SWITCHED  --  [windows.onFocusChanged]');

            // todo: how to get tabId in here...?  
            if ( Env.tabs_setup[tabId]?.lock )   {
                return console.log( '== : LOCKED - operation in progress. - EXIT.' );
            }
            
            // should be right here! on begin of the event hit
            console.log( '[LOCK]' );
            Env.lock = true;

            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onFocusChanged' );
        });


        // on LOAD PAGE
        chrome.tabs.onUpdated.addListener( function (tabId, changeInfo) {
return;            
            console_setupStartDivider(' --  event: PAGE LOAD  --  [tabs.onUpdated]');
// todo: this callback is (or can be) probably identical with the one from switch tab - unify!            
            // this filter doesn't work well, it ignores clicks on previously loaded tabs and doesn't reset setup
            /*console.log('changeInfo', changeInfo);
            if ( !changeInfo.status )   {
                console.log( ': EXIT / Not a page re/load event, but some other onUpdated hit (like injected badge)' );
                return;
            }*/
            
            
        // let tabId = highlightInfo?.tabIds[0] ?? 0;
 
            if (!tabId) {
                return console.log('- ERROR - no tabId from onHighlighted... highlightInfo. ');
            }
            if ( Env.tabs_setup[tabId]?.lock )   {
                return console.log( '== : LOCKED - operation in progress. - EXIT.' );
            }

            // START SETUP

            // reset previous data stored for this tab
            Env.tabs_setup[tabId] = {};
            Env.tabs_log[tabId] = [];

            // set lock
            Env.logGroup( '== SETUP TAB id = '+tabId, true, tabId );
            Env.log( '[LOCK]', tabId, 0, 0 );
            Env.tabs_setup[tabId].lock = true;

// TODO: CAN WE REUSE THIS PART?

            Env.promiseTabsGet(tabId)
                .then( async (tab) => {
                    Env.log('= TAB '+tabId+' - START ->>>', tabId, 0, 2 );
                    Env.log('TAB object', tabId, Env.LEVEL_debug, 1, tab );

                    // ! in that bug situation it doesn't fail, it just returns undefined in success-way!
                    if (typeof tab === 'undefined') {
                        Env.log( ' ! ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION !', tabId, 3 );
                            // AA:
                        // console.log( 'changeInfo', changeInfo );
                            // BB:
                        // Env.log( ' - tabId: ' + tabId + ' highlightInfo', tabId, 2, 1, highlightInfo );
                        // Env.log( ' - output from .runtime.lastError: ', tabId, 2, 0, chrome.runtime.lastError )
                        Env.log( ' - output from .runtime.lastError: ' + chrome.runtime.lastError.message, tabId, 2, 0 )
                        Env.log( ' : EXIT / No tab object for some reason', tabId, 1 );
                        Env.helper_finishProjectSetup(tabId, true);
                        return;
                    }

                    // check if completed and if not - delay execution (don't loop checking this, better try to load it anyway after a while.
                    // this way it should fix missing favicon/badge problem, but doesn't make you wait every time until all assets finishes loading
                    // until the badge finally displays.) todo: observe the new behaviour, revert in case of problems
                    if ( tab?.status === 'loading' )   {
                        Env.log( ': PAGE IS STILL LOADING - delay project init', tabId, 2, 1 );
                        setTimeout(function(){
                            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted', tabId );
                        }, 500);
                    }
                    else    {
                        Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted', tabId );
                    }
                })
                .catch( (e) => console.log(e) );
        });
    },

    
    /**
     * Get tab by id
     * @return {Promise<unknown>}
     */
    promiseTabsGet: function(tabId ) {
        return new Promise((resolve, reject) => {
            try {
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
            }


            // normally this should work:
            /*try {
                chrome.tabs.get( tabId, async function(tab) {
                    resolve( tab );
                });
            } catch (e) {
                reject(e);
            }*/
        })
    },

    /**
     * Get tabs
     * @return {Promise<unknown>}
     */
    promiseTabsQuery: function(query ) {
        return new Promise((resolve, reject) => {
            try {
                // workaround for chrome 91 bug with error 'Tabs cannot be edited right now (user may be dragging a tab).'
                const loop = function () {

                    chrome.tabs.query( query, async function(tabs) {
                        
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
            }


            // normally this should work:
            /*try {
                chrome.tabs.query( query, async function(tab) {
                    resolve( tab );
                });
            } catch (e) {
                reject(e);
            }*/
        })
    },

    /**
     * looks for current tab url in projects config. if found, rebuilds action menu, badge and other env settings
     * @param options
     * @param projectsAll
     * @param _debugEventTriggered
     * @param tabId
     */
    findAndApplyProjectConfigForCurrentTabUrl: function(options, projectsAll, _debugEventTriggered, tabId) {

        let loadFavicon = _debugEventTriggered === 'onUpdated';
        let loadBadge = _debugEventTriggered === 'onUpdated';


        Env.logGroup( '=== Match url, cleanup & preparations', true, tabId );
        Env.log('- PROJECT CONTEXT SETUP begin - find project for current url & rebuild menu', tabId, 1, 2 );

        // clear current options
        Env.log('-- MENU: flush', tabId, 0, 2 );
        chrome.contextMenus.removeAll( () => {

            // deactivate icon
            Env.log( '-- ICON: deactivate', tabId, 1, 2 );
            Env.setActionIcon( '', tabId );


            // gets current tab with details (tab from events only returns id)
            Env.promiseTabsQuery({active: true, lastFocusedWindow: true})
                .then( async (tabs) => {

                    let tab = tabs[0] ?? null;
                    if ( !tab ) {
                        Env.log( ' ! ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION !', tabId, 3 );
                        Env.log( ' - tabId: ' + tabId + '', tabId, 2, 1 );
                        Env.log( ' - output from .runtime.lastError: ', tabId, 2, 0, chrome.runtime.lastError?.message )
                        Env.log( ' : EXIT / No tab object for some reason', tabId, 1 );
                        // console.log(' - Can\'t read tab (system?) - EXIT');
                        Env.helper_finishProjectSetup(tabId, true);
                        // close group again, because here we're on second level nest
                        console.groupEnd();
                        console.log(' - Can\'t read tab (system?) - EXIT');
                        return;
                    }

                    if ( !tab.url.toString().startsWith('http') )   {
                        loadFavicon = false;
                        loadBadge = false;
                    }

                    let isProjectFound = false;



                    // setup new ones, if url found in config
                    if ( typeof projectsAll !== 'undefined' ) {
                        for ( let p = 0;  p < projectsAll.length;  p++ ) {

                            let project = projectsAll[p];

                            if ( project.hidden || !project.name )
                                continue;


                            if ( typeof project.contexts !== 'undefined' ) {
                                for ( let c = 0;  c < project.contexts.length;  c++ ) {

                                    let context = project.contexts[c];

                                    if ( context.hidden )
                                        continue;

                                    // compare ignoring schema (& trailing slash in configured url)
                                    if ( context.url  &&  tab.url.replace( /^https?:\/\//, '//')
                                            .match( context.url.replace( /^https?:\/\//, '//').replace( /\/$/, '') ) ) {

                                        isProjectFound = true;
                                        
                                        // close group, then open next on the same level
                                        Env.logGroup(null, false, tabId);
                                        Env.log('* MATCHED URL   ** **   FOUND PROJECT!' /*+ project.name +'  -  context: '+ context.name*/, tabId, 1, 0, {project: project.name, context: context.name});
                                        Env.logGroup( '=== Setup tab for active project', true, tabId );


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
                                        Env.log('* MATCHED URL   ** **   FOUND PROJECT!' /*+ project.name +'  -  context: '+ context.name*/, tabId, 1, 0, {project: project.name, link: link.name});
                                        Env.logGroup( '=== Setup tab for active project', true, tabId );


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
                    }

                    Env.logGroup(null, false, tabId);
                    Env.log('- project NOT FOUND.', tabId);
                    Env.logGroup( '=== Setup tab', true, tabId );
                    Env.log( '-- MENU: standard menu items, All Projects, custom links, if enabled', tabId );

                    // if project not found, build standard menu
                    Env.setupContextMenu( [], '', [], tabId, _debugEventTriggered );
                    // check if not better close group before menu build, it may take time and mix console logs
            });
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
        
                    // clear current options again / to be sure it's empty before adding anything
                    // Env.log('--- menu clean', tabId, 1, 2);
                    //chrome.contextMenus.removeAll( function () {

            let menuItems = [];
            let mark = '';
            let options = Env.options;



            // New permissions info     // todo: delete in a few minor version

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


                let tempMenuContexts = [ 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'page_action', 'browser_action' ];
                chrome.contextMenus.create({
                    title :     '!!!  IMPORTANT  !!!  Your attention needed - open Options / SEE DETAILS ->',
                    contexts :  tempMenuContexts,
                    id :        'TEMP-message_perms'
                });
                chrome.contextMenus.create({
                    title :     'TEMP-message_perms_separator',
                    id :        'TEMP-message_perms_separator',
                    contexts :  tempMenuContexts,
                    type :      'separator',
                });
            }





            // -- ENVIRONMENTS (CONTEXTS)
            if ( typeof project.contexts !== 'undefined' ) {

                let c = 0;

                for ( c;  c < project.contexts.length;  c++ ) {

                    let context = project.contexts[c];

                    if ( context.hidden || !context.url || !context.name )
                        continue;

                    mark = activeContext.name === context.name  &&  activeContext.url === context.url ? '-> ' : '     ';

                    menuItems.push({
                        title : mark + context.name,
                        id :    'project-' + p + '-env-' + c,
                        parentId :  'parent_contexts',
                        showForMenuType :   'actionMenuOnly'
                    });
                    menuItems.push({
                        title : mark + context.name,
                        id :    'project-' + p + '-env-' + c,
                        showForMenuType :   'rightClickOnly'
                    });
                }

                // if any not hidden contexts
                if ( c > 0 )    {
                    // add top level submenu because of action icon menu positions limit in chrome...
                    //if ( contextMenuItems.length > chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT )  {

                    // add top level submenu always (for action icon, not for page right click menu)
                    chrome.contextMenus.create({
                        title :     project.name + ': contexts',
                        contexts :  [ 'browser_action' ],
                        id :        'ICON-parent_contexts'
                    });
                }
            }


            // -- LINKS
            if ( typeof project.links !== 'undefined' ) {

                let separatorAdded = false;
                let l = 0;

                for ( l;  l < project.links.length;  l++ ) {

                    let link = project.links[l];

                    if ( link.hidden || !link.url || !link.name)
                        continue;

                    mark = activeContext.name === link.name && activeContext.url === link.url ? '-> ' : '     ';

                    // add separator on first (not hidden) item
                    if ( !separatorAdded ) {
                        menuItems.push({
                            // for action icon where we use submenus, we set parentId
                            // in that case this separator is not used.
                            // it's only for page context menu, where we don't use additional submenus
                            title :             '_separator-links',    // needed to not cause error later in iteration
                            id :                'separator_links',    // needed to not cause error later in iteration
                            type :              'separator',
                            showForMenuType :   'rightClickOnly'
                        });
                        separatorAdded = true;
                    }

                    menuItems.push({
                        title : mark + link.name,
                        id :    'project-' + p + '-link-' + l,
                        parentId :  'parent_links',
                        showForMenuType :   'actionMenuOnly'
                    });
                    menuItems.push({
                        title : mark + link.name,
                        id :    'project-' + p + '-link-' + l,
                        showForMenuType :   'rightClickOnly'
                    });
                }

                // if any not hidden links
                if ( l > 0 ) {
                    chrome.contextMenus.create({
                        title :     project.name + ': links',
                        contexts :  [ 'browser_action' ],
                        id :        'ICON-parent_links'
                    });
                }
            }


            menuItems.push({
                title :             '_separator-shortcustom',
                id :                'separator_shortcustom',
                type :              'separator',
                showForMenuType :   'rightClickOnly'
            });


            // -- Custom shortcut 1
            if ( options.env_menu_short_custom1  &&  options.env_menu_short_custom1 !== '' ) {
                let linkParts_short1 = options.env_menu_short_custom1.split(' | ');

                menuItems.push({
                    title : linkParts_short1[1] ?? linkParts_short1[0],
                    id :    'project-' + p + '-shortcustom-1'
                });
            }


            // -- Custom shortcut 2
            if ( options.env_menu_short_custom2  &&  options.env_menu_short_custom2 !== '' ) {
                let linkParts_short2 = options.env_menu_short_custom2.split(' | ');

                menuItems.push({
                    title : linkParts_short2[1] ?? linkParts_short2[0],
                    id :    'project-' + p + '-shortcustom-2'
                });
            }


            // -- ALL PROJECTS
            if ( options.env_menu_show_allprojects ) {
                
                let separatorAdded = false;

                menuItems.push({
                    title :             'All projects',
                    id :                'allprojects',
                    //showForMenuType :   'actionMenuOnly'
                });

                // iterate all projects and links
                if ( typeof Env.projectsAll !== 'undefined' ) {
                    for ( let _p = 0;  _p < Env.projectsAll.length;  _p++ ) {
                        let _project = Env.projectsAll[_p];
                        if ( _project.hidden || !_project.name )
                            continue;
                        menuItems.push({
                            title :             _project.name,
                            id :                'allprojects_project-' + _p,
                            parentId :          'allprojects',
                        });
                        if ( typeof _project.contexts !== 'undefined' ) {
                            for ( let _c = 0;  _c < _project.contexts.length;  _c++ ) {
                                let _context = _project.contexts[_c];
                                if ( _context.hidden || !_context.url || !_context.name )
                                    continue;

                                menuItems.push({
                                    title :             _context.name,
                                    id :                'allprojects_project-' + _p + '-env-' + _c,
                                    parentId :          'allprojects_project-' + _p,
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
                                        title :             '_separator-links',
                                        id :                'allprojects_project-' + _p + '-separator-links',
                                        parentId :          'allprojects_project-' + _p,
                                        type :              'separator',
                                    });
                                    separatorAdded = true;
                                }

                                menuItems.push({
                                    title :             _link.name,
                                    id :                'allprojects_project-' + _p + '-link-' + _l,
                                    parentId :          'allprojects_project-' + _p,
                                });
                            }
                        }
                    }
                }

            }

            
            menuItems.push({
                title :             '_separator-tools',
                id :                'separator_tools',
                type :              'separator',
                showForMenuType :   'rightClickOnly'
            });


            // additional tools submenu
            menuItems.push({
                title :             'Tools',
                id :                'tools',
                showForMenuType:    'actionMenuOnly',
            });

            menuItems.push({
                title :             'Add/Edit current URI',
                id :                'tool--add_edit',
                parentId :          'tools',
                showForMenuType:    'actionMenuOnly',
            });
            
            menuItems.push({
                title :             'Add/Edit current URI',
                id :                'tool--add_edit',
                showForMenuType:    'rightClickOnly',
            });

            menuItems.push({
                title :             'Options',
                id :                'tool--options',
                showForMenuType:    'rightClickOnly',
            });
            
            // assume it's firefox - add Options to icon menu - it's not there by default like in chrome
            if ( typeof browser !== 'undefined' ) {
                menuItems.push({
                    title :     'Options',
                    id :        'tool--options',
                    parentId :    'tools',
                    showForMenuType:    'actionMenuOnly',
                });
            }


            // when item array ready,
            // BUILD THE MENU

            if ( Env.DEBUG )    {
                // console.log('--- ITEMS: ');
                // console.dir(menuItems);
            }
                
            Env.log('--- MENU ITEMS: ', tabId, 1, 1, menuItems);

            let menuCallback;

            // set up context menu
            for ( let i = 0;  i < menuItems.length;  i++ ) {


                // on last item
                if ( i+1 === menuItems.length ) {

                    menuCallback = function () {
                            if ( chrome.runtime.lastError ) {
                                Env.log('Warn: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered, tabId, 2, 0 );
                                Env.log(chrome.runtime.lastError.message, tabId, 3, 0);
                            }

                            Env.log('--- MENU: Successfully built', tabId, 1, 2);

                            // LOCK RELEASE, end group, end top group, output collected log
                            Env.logGroup(null, false, tabId);
                            Env.helper_finishProjectSetup(tabId, true);
                            console.log( '== * DONE - tab handle end - EXIT [LOCK RELEASE]', tabId );
                    };
                }
                else    {
                    menuCallback = function () {
                            if ( chrome.runtime.lastError ) {
                                Env.log('Warn: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered, tabId, 2, 0 );
                                Env.log(chrome.runtime.lastError.message, tabId, 3, 0);
                            }
                    };
                }



                // ACTION ICON MENU
                if ( typeof menuItems[i].showForMenuType === 'undefined'
                    // don't show items dedicated only to right-click menu (like separators, when no submenus used there)
                    ||  ( typeof menuItems[i].showForMenuType !== 'undefined'  &&  menuItems[i].showForMenuType !== 'rightClickOnly' ) )  {

                    chrome.contextMenus.create({
                            title :     menuItems[i].title,
                            contexts :  [ 'browser_action' ],
                            id :        'ICON-'+menuItems[i].id,
                            type :      menuItems[i]?.type === 'separator'
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
                if ( typeof menuItems[i].showForMenuType === 'undefined'
                    // don't show items dedicated only to action icon menu (like separators, when no submenus used there)
                    ||  ( typeof menuItems[i].showForMenuType !== 'undefined'  &&  menuItems[i].showForMenuType !== 'actionMenuOnly' ) )  {

                    chrome.contextMenus.create({
                            title :     menuItems[i].title,
                            contexts :  [ 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'page_action' ],
                            id :        'RIGHT-'+menuItems[i].id,
                            type :      menuItems[i]?.type === 'separator'
                                ? 'separator'
                                : 'normal',

                            parentId :  menuItems[i]?.parentId
                                ? 'RIGHT-'+menuItems[i].parentId
                                : null
                        },
                        menuCallback
                    );
                }
            }
    },


    /**
     * Inject badge script with it's settings into current tab source
     * @param context (actually, now it may be Context or Link)
     * @param project
     * @param tab
     * @param _debugEventTriggered
     */
    setupBadge : function (context, project, tab, _debugEventTriggered) {

        if ( !tab.url.toString().startsWith('http') )   {
            return Env.log('Env.setupBadge(): tab url is not http type (probably system page). Exit', tab.id, 0, 2);
        }

        if ( !context.color )   {
            return Env.log('Env.setupBadge(): color not set. project / context: \n'+ project.name +' / '+context.name, tab.id, 2, 0);
        }

        chrome.tabs.executeScript( tab.id, {

            code: 'var badge_params = {' +
                    'DEV: '+Env.DEV+',' +
                    'projectLabel: "'+project.name+'",' +
                    'contextLabel: "'+context.name+'",' +
                    'contextColor: "'+context.color+'",' +
                    'projectLabelDisplay: '+( typeof Env.options.env_badge_projectname === 'undefined'  ||  Env.options.env_badge_projectname === true  ?  'true'  :  'false' )+',' +
                    'scale: '+( typeof Env.options.env_badge_scale !== 'undefined'  ?  parseFloat( Env.options.env_badge_scale )  :  1.0 )+',' +
                    'position: "'+( typeof Env.options.env_badge_position !== 'undefined'  ?  Env.options.env_badge_position  :  'left' )+'",' +
                    '_debugEventTriggered: "'+_debugEventTriggered+'"' +
                '};'

        }, function () {

            // on system pages you can't inject any scripts
            if ( chrome.runtime.lastError ) {
                Env.log('Env.setupBadge(): Error executing code: \n' + chrome.runtime.lastError.message, tab.id, 2, 1);
            }
            else {
                chrome.tabs.executeScript( tab.id, {

                    file: 'setBadge.js'

                }, function() {
                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        Env.log('Error injecting badge script: \n' + chrome.runtime.lastError.message, tab.id, 1, 1);
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
    setupFavicon : function (context, project, tab, _debugEventTriggered) {
        
        if ( !tab.url.toString().startsWith('http') )   {
            return Env.log('Env.setupFavicon(): tab url is not http type (probably system page). Exit', tab.id, 0, 2);
        }

        if ( !context.color )   {
            return Env.log('Env.setupFavicon(): color not set. project / context: \n' + project.name + ' / ' + context.name, tab.id, 2, 0);
        }

        chrome.tabs.executeScript( tab.id, {

            code: 'var favicon_params = {' +
                    'DEV: '+Env.DEV+',' +
                    'contextColor: "'+context.color+'",' +
                    'alpha: '+( typeof Env.options.env_favicon_alpha !== 'undefined'  ?  parseFloat( Env.options.env_favicon_alpha )  :  0.85 )+',' +
                    'fill: '+( typeof Env.options.env_favicon_alpha !== 'undefined'  ?  parseFloat( Env.options.env_favicon_fill )  :  0.25 )+',' +
                    'position: "'+( typeof Env.options.env_favicon_position !== 'undefined'  ?  Env.options.env_favicon_position  :  'bottom' )+'",' +
                    'composite: "'+( typeof Env.options.env_favicon_composite !== 'undefined'  ?  Env.options.env_favicon_composite  :  'source-over' )+'",' +
                    '_debugEventTriggered: "'+_debugEventTriggered+'"' +
                '};'

        }, function () {

            // on system pages you can't inject any scripts
            if ( chrome.runtime.lastError ) {
                Env.log('Env.setupFavicon(): Error executing code: \n' + chrome.runtime.lastError.message, tab.id, 2, 1);
            }
            else {
                chrome.tabs.executeScript( null, {

                    file: 'setFavicon.js'

                }, function() {

                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        Env.log('Error injecting favicon script: \n' + chrome.runtime.lastError.message, tab.id, 1, 1);
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
            let _currentTab = tabs[0];

            var newTabUrl = '';

            // if we are on project's link, not context, we may not get activeContext
            if ( typeof activeContext !== 'undefined'  &&  typeof activeContext.url !== 'undefined' )  {
                // strip trailing slash
                var activeContextBaseUrl = activeContext.url.replace( /\/$/, '' );
                var newContextBaseUrl = newContext.url.replace( /\/$/, '' );

                console.log('active url: ' + activeContextBaseUrl);
                console.log('target url: ' + newContextBaseUrl);

                newTabUrl = _currentTab.url.replace( activeContextBaseUrl, newContextBaseUrl );
            }
            else    {
                newTabUrl = newContext.url;
            }

            console.info(':: OPEN TAB [ENV] & EXIT: ' + newTabUrl);
            console.groupEnd();
            //Env.logGroup( null, false, tabId );

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
                chrome.browserAction.setIcon({
                    path : 'Icons/icon-48-act.png',
                    tabId: tabId
                });
                break;

            default:
                chrome.browserAction.setIcon({
                    path : 'Icons/icon-48.png',
                    tabId: tabId
                });
        }
    },

    LEVEL_debug: -1,
    LEVEL_log: 0,
    LEVEL_info: 1,
    LEVEL_warn: 2,
    LEVEL_error: 3,

    /**
     * Store log messages in collection, console.log if needed (in debug mode)
     * @param msg string
     * @param tabId int, Basically a key for grouping logs
     * @param severityLevel int [-1-3], Default 0 (log)
     * @param logDetailLevel int, Higher number allows not to see it, unless debugLevel >= logLevel. 0 [default] = show always [todo]
     * @param variable <misc>, Variable to log
     */
    log: function (msg, tabId, severityLevel, logDetailLevel, variable)   {
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
        if ( 0 && Env.DEBUG  &&  Env.DEV >= logDetailLevel )  {
            switch (severityLevel)  {
                //case -1: variable ? console.debug(msg, variable) : console.debug(msg, variable); break;
                case 0: variable ? console.log(msg, variable) : console.log(msg); break;
                case 1: variable ? console.info(msg, variable) : console.info(msg); break;
                case 2: variable ? console.warn(msg, variable) : console.warn(msg); break;
                case 3: variable ? console.error(msg, variable) : console.error(msg); break;
            }
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
        if ( 0 && Env.DEBUG  &&  Env.DEV >= logDetailLevel )  {
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
        // console.log ('--------------------');
        Object.entries(Env.tabs_log[key] ?? []).forEach(function([i, row])    {
            if ( (Env.DEV >= row.logLevel) || row?.group || Env.DEBUG ) {
                if (row?.group)     {
                    switch (row.group) {
                        case 'open':
                            if (row?.collapsed)
                                console.groupCollapsed(row.msg);
                            else
                                console.group(row.msg);
                            break;
                        case 'close':
                            console.groupEnd();
                            break;
                    }
                    return;
                }

                switch (row.severity)  {
                    case -1: console.log(row.msg, row.variable); break;
                    case 0: row.variable ? console.log(row.msg, row.variable) : console.log(row.msg); break;
                    case 1: row.variable ? console.info(row.msg, row.variable) : console.info(row.msg); break;
                    case 2: row.variable ? console.warn(row.msg, row.variable) : console.warn(row.msg); break;
                    case 3: row.variable ? console.error(row.msg, row.variable) : console.error(row.msg); break;
                }
            }
        });
        // remove 
        Env.tabs_log[key] = [];
        // console.log ('--------------------');
    },

    /**
     * Usually finishes + closes console group, but can also take down the lock, finishing whole process
     * @param tabId int
     * @param unlock bool
     */
    helper_finishProjectSetup: function (tabId, unlock) {
        if (unlock) {
            if (typeof Env.tabs_setup[tabId] === 'undefined')
                Env.tabs_setup[tabId] = {}; 
            Env.tabs_setup[tabId].lock = false;
            Env.log( '[UNLOCK]', tabId );
        }
        Env.logGroup( null, false, tabId );
        Env.printLogs( tabId );
        Env.printLogs( '_general_log' );    // print also this one, after group close
    },
};





/**
 * The whole magic
 */


async function initTheMagic()
{
    await Env.promiseConfig()
        .then( (options) => Env.setupOptions(options) )
        .then( () => Env.bindProjectDetection() )
        .catch( (e) => console.log(e) );

    //throw 'some error';
    // classic try..catch doesn't work for async!
}
initTheMagic()
    .catch( (e) => console.log(e) );



    




// why this is here replayed, not where it binds all


chrome.storage.sync.get( null, function(options) {



        /**
         * Handle menu items onclick (the only way to pass params)
         */
        chrome.contextMenus.onClicked.addListener(function(info, tab) {

            // console.log(info);
            // console.log(tab);
            // console.log(Env.options);
            
            /** syntax:
                    clickSrc-itemType-itemIndex-itemSubType-itemSubIndex
                examples:
                    ICON-project-20-link-3,
                    ICON-allprojects_project-4
                    RIGHT-shortcustom-4-shortcustom-2
                    ICON-tool--addedit
             */

            // extract necessary info from button id
            let idParts = info?.menuItemId?.split(/-/);
            let itemType = idParts[1];
            let itemIndex = idParts[2];
            let itemSubType = idParts[3];
            let itemSubIndex = idParts[4];

            console.group('open tab. menu position params:');
            console.log({clickSrc: idParts[0], itemIndex: itemIndex, itemType: itemType, itemSubType: itemSubType, itemSubIndex: itemSubIndex});
            console.log(idParts);

            


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
                chrome.tabs.query( {active: true, currentWindow: true}, function(tabs) {
                    let tab = tabs[0];
                    chrome.storage.local.set({ 'urlAddEdit': tab.url }, function() {
                        
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
            console.log(project);
            console.log(itemSubType);

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
                

                if ( itemSubType === 'shortcustom'  &&  itemSubIndex === '1') {
                    Switcher.openCustomShortcut( activeContext.url ?? '', options.env_menu_short_custom1, '1' );
                    return;
                }

                if ( itemSubType === 'shortcustom'  &&  itemSubIndex === '2') {
                    Switcher.openCustomShortcut( activeContext.url ?? '', options.env_menu_short_custom2, '2' );
                    return;
                }
                
                
                
                if ( typeof project.contexts !== 'undefined' )  {
                    var newContext = project.contexts[ itemSubIndex ];
                }
    
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
                // console.groupEnd();

                Env.switchEnvironment( newContext, activeContext, project );
            });

        });

});
