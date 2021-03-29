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
 * (Note, that "contextMenus" for chrome means "right click on context", where "context" means where it's clicked.
 * - And for us the "context" (or environment) means the server, where the project runs.
 * It's important in this file, where the context menu are set up. Please remember this and don't mix them!)
 */

// console.log('environment.js loaded');




var Env = {

    DEV: false,

    options: null,
    projectsAll: null,

    /**
     * lock avoids paralell setup when multiple events triggers
     */
    lock: false,


    /**
     * find current url in projects options. if found - set new menu and badge. otherwise exit
     */
    initProject : function()   {
        
        let console_setupProjectVisualDivider = function()   {
            console.info('');
            console.info('=============  RUN ENVIRONMENT SETUP  =============');
        }

        // do the whole job on these specified events hit, to reinit the menu etc. every time in current window a tab
        // is switched / page is loaded in current tab / - basically when current window's content / viewport / url changes
        // we rebuild the menu and replace the action icon indicator

        // on switch tab
        chrome.tabs.onHighlighted.addListener( function (highlightInfo) {

            // try these
            // chrome.tabs.onHighlightChanged.addListener( function (highlightInfo) {
            // [works bad]
            // this one: chrome.tabs.onSelectionChanged.addListener( function (tabId, selectInfo) can't be used here, it have to run on tab focus

            console_setupProjectVisualDivider();
            console.log(': EVENT: tabs.highlightInfo');
            
            // we can't use this here - a) we don't get it from this event, b) we have to run it 
            // if ( !highlightInfo.url )  { ...

            
            if ( Env.lock )   {
                console.log( ': LOCKED! operation in progress. exit' );
                return;
            }
            
            // should be right here! on begin of the event hit
            console.log( '[LOCK]' );
            Env.lock = true;


            let tabId = (typeof highlightInfo.tabIds !== 'undefined') ? highlightInfo.tabIds[0] : 0;

            chrome.tabs.get( tabId, function(tab){

                if (typeof tab === 'undefined') {
                    console.log( ': ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION. Params from callback:' );
                    console.log( 'tabId: ' + tabId + ' highlightInfo', highlightInfo );
                    console.log( ': EXIT / No tab object for some reason' );
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
                        Env.setupContextMenu( [], -1, [], 'onHighlighted' );
                        console.log( ': EXIT' );
                    });
                    return;
                }*/


                // check if completed and if not - delay execution (don't loop checking this, better try to load it anyway after a while.
                // this way it should fix missing favicon/badge problem, but doesn't make you wait every time until all assets finishes loading
                // until the badge finally displays.) todo: observe the new behaviour, revert in case of problems
                if ( tab.status === 'loading' )   {
                    console.log( ': PAGE IS STILL LOADING - delay project init' );
                    setTimeout(function(){
                        Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted' );
                    }, 500);
                }
                else    {
                    Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted' );
                }
            });
        });


        // on switch window
        // (focus window with some tab open doesn't hit any event on this tab, so we need this also) 
        chrome.windows.onFocusChanged.addListener( function (windowId) {
            console_setupProjectVisualDivider();
            console.log(': EVENT: windows.onFocusChanged');

            if ( Env.lock )   {
                console.log( ': LOCKED! operation in progress. exit' );
                return;
            }
            
            // should be right here! on begin of the event hit
            console.log( '[LOCK]' );
            Env.lock = true;

            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onFocusChanged' );
        });


        // on load page
        chrome.tabs.onUpdated.addListener( function (tabId, changeInfo) {
            console_setupProjectVisualDivider();
            console.log(': EVENT: tabs.onUpdated');
            
            // this filter doesn't work well, it ignores clicks on previously loaded tabs and doesn't reset setup
            /*console.log('changeInfo', changeInfo);
            if ( !changeInfo.status )   {
                console.log( ': EXIT / Not a page re/load event, but some other onUpdated hit (like injected badge)' );
                return;
            }*/
            
            
            if ( Env.lock )   {
                console.log( ': LOCKED! operation in progress. exit' );
                return;
            }
            
            // should be right here! on begin of the event hit
            console.log( '[LOCK]' );
            Env.lock = true;


            chrome.tabs.get( tabId, function(tab) {
                if ( typeof tab === 'undefined' ) {
                    console.log( ': ** TAB OBJECT DOESN\'T EXIST. IT SHOULD NOT HAPPEN. INVESTIGATE THE SITUATION. Params from callback:' );
                    console.log( 'changeInfo', changeInfo );
                    Env.lock = false;
                    console.log( ': EXIT / No tab object for some reason [LOCK RELEASED]' );
                    return;
                }

                if ( tab.status === 'loading' )   {
                    console.log( ': PAGE IS STILL LOADING - delay project init' );
                    setTimeout(function(){
                        Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onUpdated' );
                    }, 500 );
                }
                else    {
                    Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onUpdated', tabId );
                }
            });
        });
    },


    /**
     * looks for current tab url in projects config. if found, rebuilds action menu, badge and other env settings
     * @param options
     * @param projectsAll
     * @param _debugEventTriggered
     * @param tabId
     */
    findAndApplyProjectConfigForCurrentTabUrl : function(options, projectsAll, _debugEventTriggered, tabId) {

        var loadFavicon = _debugEventTriggered === 'onUpdated';
        var loadBadge = _debugEventTriggered === 'onUpdated';


        console.groupCollapsed('Start - handle active tab');
        console.info('- PROJECT CONTEXT SETUP begin - find project for current url & rebuild menu');

        // clear current options
        console.log('-- MENU: clean');
        chrome.contextMenus.removeAll( function () {

            // deactivate icon
            console.info('-- ICON: deactivate');
            Env.setActionIcon( '', tabId );

            // project and link not needed for now, disable to not hit storage write quota
            // chrome.storage.sync.set({'_currentProject': {}});
            // chrome.storage.sync.set({'_currentContext': {}});
            // chrome.storage.sync.set({'_currentLink': {}});

            // gets current tab with details (tab from events only returns id)
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                let tab = tabs[0];
                if (typeof tab === 'undefined') {
                    console.groupEnd();
                    console.log('Can\'t read tab (system?) - exit [ LOCK RELEASE ]');
                    Env.lock = false;
                    return;
                }
                
                if ( !tab.url.toString().startsWith('http') )   {
                    loadFavicon = false;
                    loadBadge = false;
                }

                var isProjectFound = false;



                // setup new ones, if url found in config
                if ( typeof projectsAll !== 'undefined' ) {
                    for ( var p = 0;  p < projectsAll.length;  p++ ) {

                        var project = projectsAll[p];

                        if ( project.hidden || !project.name )
                            continue;


                        if ( typeof project.contexts !== 'undefined' ) {
                            for ( var c = 0;  c < project.contexts.length;  c++ ) {

                                var context = project.contexts[c];

                                if ( context.hidden )
                                    continue;

                                // compare ignoring schema (& trailing slash in configured url)
                                if ( context.url  &&  tab.url.replace( /^https?:\/\//, '//')
                                        .match( context.url.replace( /^https?:\/\//, '//').replace( /\/$/, '') ) ) {

                                    isProjectFound = true;

                                    console.groupEnd();
                                    console.info('* FOUND project: ', project.name, ', context: ', context.name);
                                    console.groupCollapsed( 'Setup active project' );


                                    console.info('-- ICON: activate');
                                    Env.setActionIcon( 'active', tabId );

                                    // don't check this option - show menu always anyway. no reason to disable it and show only badge.
                                    // also it's problematic due to locks - menu and badge are starting the same time. probably must be done using call chain)
                                    //if ( options.env_switching !== false )  {
                                    Env.setupContextMenu( context, p, project, _debugEventTriggered );

                                    if ( options.env_badge !== false  &&  loadBadge )  {
                                        console.info('-- BADGE: inject ');
                                        Env.setupBadge( context, project, tab, _debugEventTriggered );
                                    }

                                    // todo: make sure, if options can be read simply or with typeof to not cause errors after update ext and no such option saved yet
                                    if ( ( typeof options.env_favicon === 'undefined'  ||  options.env_favicon === true )  &&  loadFavicon )    {
                                        Env.setupFavicon( context, project, tab, _debugEventTriggered );
                                    }

                                    // stop searching projects, without releasing the lock (release in setup callback)
                                    return;
                                }
                            }
                        }

                        if ( typeof project.links !== 'undefined' ) {
                            for ( var l = 0;  l < project.links.length;  l++ ) {

                                var link = project.links[l];

                                if ( link.hidden )
                                    continue;

                                if ( link.url  &&  tab.url.match( link.url ) ) {

                                    isProjectFound = true;

                                    console.info('--- FOUND project: ', project.name, ', link: ', link.name);


                                    console.info('-- ICON: activate');
                                    Env.setActionIcon( 'active', tabId );

                                    Env.setupContextMenu( link, p, project, _debugEventTriggered );

                                    if ( options.env_badge !== false )  {
                                        link.color = '#cccccc';
                                        Env.setupBadge( link, project, tab, _debugEventTriggered );
                                    }

                                    // stop searching projects, without releasing the lock (release in setup callback)
                                    return;
                                }
                            }
                        }
                    }
                }

                // if project not found, build standard menu
                console.groupEnd();
                console.info('- project NOT FOUND.');
                console.groupCollapsed( 'Setup only non-project stuff' );

                console.info( '-- MENU: standard menu items, All Projects, custom links, if enabled' );
                Env.setupContextMenu( [], '', [], _debugEventTriggered );
            });
        });
    },


    /**
     * Add to submenu all contexts of a project
     * @param activeContext
     * @param p - project's array index
     * @param project
     * @param _debugEventTriggered
     */
    setupContextMenu : function(activeContext, p, project, _debugEventTriggered) {

        console.log('-- MENU: rebuild');
        
        // clear current options again / to be sure it's empty before adding anything
        
        console.log('--- menu clean');
        chrome.contextMenus.removeAll( function () {

            var contextMenuItems = [];
            var mark = '';
            var options = Env.options;



            // New permissions info
            //   When the ext was just updated to a version with the new host-permissions, it won't work until the permissions are granted.
            //   We need to inform the user about that situation and let him go to the options and save them to trigger permission check.
            //
            //   Here we show the info as an additional position in ext menus (only for current users after update, with stored projects / urls
            //   for which we need to request for that permission.)


            // display info as temporary menu position about needed actions - to make user see this when tries to first use updated Switcher, which will not work yet -
            // it will show the message on an existing initiated project and points to options screen
            // won't show to new users (identify by empty options storage), if no project is currently set, or if ..._acknowledged = true)
            if ( typeof project.uuid !== 'undefined'    // we don't have all projects array here, but this way we can check if some project is currently set in this tab 
                    &&  options.env_enable      // check existence of one of basic config options - if no such, it means user wasn't in option yet and is a new user
                    &&  ! options.internal_permissions_acknowledged )  {


                let tempMenuContexts = [ "page", "frame", "selection", "link", "editable", "image", "video", "audio", "page_action", "browser_action" ];
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

                var c = 0;

                for ( c;  c < project.contexts.length;  c++ ) {

                    var context = project.contexts[c];

                    if ( context.hidden || !context.url || !context.name )
                        continue;

                    mark = activeContext.name === context.name && activeContext.url === context.url ? '-> ' : '     ';

                    contextMenuItems.push({
                        title : mark + context.name,
                        id :    'project-' + p + '-env-' + c,
                        parentId :  'parent_contexts',
                        showForMenuType :   'actionMenuOnly'
                    });
                    contextMenuItems.push({
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
                        contexts :  [ "browser_action" ],
                        id :        'ICON-parent_contexts'
                    });
                }
            }


            // -- LINKS
            if ( typeof project.links !== 'undefined' ) {

                var separatorAdded = false;
                var l = 0;

                for ( l;  l < project.links.length;  l++ ) {

                    var link = project.links[l];

                    if ( link.hidden || !link.url || !link.name)
                        continue;

                    mark = activeContext.name === link.name && activeContext.url === link.url ? '-> ' : '     ';

                    // add separator on first (not hidden) item
                    if ( !separatorAdded ) {
                        contextMenuItems.push({
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

                    contextMenuItems.push({
                        title : mark + link.name,
                        id :    'project-' + p + '-link-' + l,
                        parentId :  'parent_links',
                        showForMenuType :   'actionMenuOnly'
                    });
                    contextMenuItems.push({
                        title : mark + link.name,
                        id :    'project-' + p + '-link-' + l,
                        showForMenuType :   'rightClickOnly'
                    });
                }

                // if any not hidden links
                if (l > 0) {
                    chrome.contextMenus.create({
                        title :     project.name + ': links',
                        contexts :  [ "browser_action" ],
                        id :        'ICON-parent_links'
                    });
                }
            }


            contextMenuItems.push({
                title :             '_separator-shortcustom',
                id :                'separator_shortcustom',
                type :              'separator',
                showForMenuType :   'rightClickOnly'
            });


            // -- Custom shortcut 1
            if ( typeof options.env_menu_short_custom1 !== 'undefined'  &&  options.env_menu_short_custom1 !== '' ) {
                let linkParts_short1 = options.env_menu_short_custom1.split(" | ");

                contextMenuItems.push({
                    title : typeof linkParts_short1[1] !== 'undefined' ? linkParts_short1[1] : linkParts_short1[0],
                    id :    'project-' + p + '-shortcustom-1'
                });
            }


            // -- Custom shortcut 2
            if ( typeof options.env_menu_short_custom2 !== 'undefined'  &&  options.env_menu_short_custom2 !== '' ) {
                let linkParts_short2 = options.env_menu_short_custom2.split(" | ");

                contextMenuItems.push({
                    title : typeof linkParts_short2[1] !== 'undefined' ? linkParts_short2[1] : linkParts_short2[0],
                    id :    'project-' + p + '-shortcustom-2'
                });
            }


            // -- ALL PROJECTS
            if ( typeof options.env_menu_show_allprojects !== 'undefined'  &&  options.env_menu_show_allprojects === true ) {

                contextMenuItems.push({
                    title :             'All projects',
                    id :                'allprojects',
                    //showForMenuType :   'actionMenuOnly'
                });

                // iterate all projects and links
                if ( typeof Env.projectsAll !== 'undefined' ) {
                    for ( var _p = 0;  _p < Env.projectsAll.length;  _p++ ) {
                        var _project = Env.projectsAll[_p];
                        if ( _project.hidden || !_project.name )
                            continue;
                        contextMenuItems.push({
                            title :             _project.name,
                            id :                'allprojects_project-' + _p,
                            parentId :          'allprojects',
                        });
                        if ( typeof _project.contexts !== 'undefined' ) {
                            for ( var _c = 0;  _c < _project.contexts.length;  _c++ ) {
                                var _context = _project.contexts[_c];
                                if ( _context.hidden || !_context.url || !_context.name )
                                    continue;
                            
                                contextMenuItems.push({
                                    title :             _context.name,
                                    id :                'allprojects_project-' + _p + '-env-' + _c,
                                    parentId :          'allprojects_project-' + _p,
                                });
                            }
                        }

                        if ( typeof _project.links !== 'undefined' ) {
                            separatorAdded = false;
                            for ( var _l = 0;  _l < _project.links.length;  _l++ ) {
                                var _link = _project.links[_l];
                                if ( _link.hidden || !_link.url || !_link.name )
                                    continue;
                                
                                // add separator on first (not hidden) item
                                if ( !separatorAdded ) {
                                    contextMenuItems.push({
                                        title :             '_separator-links',
                                        id :                'allprojects_project-' + _p + '-separator-links',
                                        parentId :          'allprojects_project-' + _p,
                                        type :              'separator',
                                        //showForMenuType :   'actionMenuOnly'
                                    });
                                    separatorAdded = true;
                                }

                                contextMenuItems.push({
                                    title :             _link.name,
                                    id :                'allprojects_project-' + _p + '-link-' + _l,
                                    parentId :          'allprojects_project-' + _p,
                                    //showForMenuType :   'actionMenuOnly'
                                });
                            }
                        }
                    }
                }

            }

            
            contextMenuItems.push({
                title :             '_separator-tools',
                id :                'separator_tools',
                type :              'separator',
                showForMenuType :   'rightClickOnly'
            });


            // additional tools submenu
            contextMenuItems.push({
                title :             'Tools',
                id :                'tools',
                showForMenuType:    'actionMenuOnly',
            });

            contextMenuItems.push({
                title :             'Add/Edit current URI',
                id :                'tool--add_edit',
                parentId :          'tools',
                showForMenuType:    'actionMenuOnly',
            });
            
            contextMenuItems.push({
                title :             'Add/Edit current URI',
                id :                'tool--add_edit',
                showForMenuType:    'rightClickOnly',
            });



            // when item array ready,
            // BUILD THE MENU

            console.log('--- ITEMS: ');
            console.dir(contextMenuItems);

            let menuCallback;

            // set up context menu
            for ( var i = 0;  i < contextMenuItems.length;  i++ ) {

                
                // on last item
                if ( i+1 === contextMenuItems.length ) {
                    menuCallback = function () {
                        if (chrome.runtime.lastError) {
                            console.warn('Error: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered);
                            console.error(chrome.runtime.lastError.message);
                        }
    
                        console.info('--- CONTEXT MENU: SUCCESS');
    
                        // release the lock
                        Env.lock = false;
                        console.groupEnd();
                        console.info('* DONE - tab handle end - EXIT [LOCK RELEASE]');
                    };
                }
                else    {
                    menuCallback = function () {
                        if ( chrome.runtime.lastError ) {
                            console.warn('Error: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered);
                            console.error(chrome.runtime.lastError.message);
                        }
                    };
                }



                // ACTION ICON MENU
                if ( typeof contextMenuItems[i].showForMenuType === 'undefined'
                    // don't show items dedicated only to right-click menu (like separators, when no submenus used there)
                    ||  ( typeof contextMenuItems[i].showForMenuType !== 'undefined'  &&  contextMenuItems[i].showForMenuType !== 'rightClickOnly' ) )  {

                    chrome.contextMenus.create({
                            title :     contextMenuItems[i].title,
                            contexts :  [ "browser_action" ],
                            id :        'ICON-'+contextMenuItems[i].id,
                            type :      typeof contextMenuItems[i].type !== 'undefined'  &&  contextMenuItems[i].type === 'separator'
                                ? 'separator'
                                : 'normal',
                            parentId: typeof contextMenuItems[i].parentId !== 'undefined'
                                ? 'ICON-'+contextMenuItems[i].parentId
                                : null
                        },
                        menuCallback
                    );
                }

                // PAGE RIGHT-CLICK MENU
                if ( typeof contextMenuItems[i].showForMenuType === 'undefined'
                    // don't show items dedicated only to action icon menu (like separators, when no submenus used there)
                    ||  ( typeof contextMenuItems[i].showForMenuType !== 'undefined'  &&  contextMenuItems[i].showForMenuType !== 'actionMenuOnly' ) )  {

                    chrome.contextMenus.create({
                            title :     contextMenuItems[i].title,
                            contexts :  [ "page", "frame", "selection", "link", "editable", "image", "video", "audio", "page_action" ],
                            id :        'RIGHT-'+contextMenuItems[i].id,
                            type :      typeof contextMenuItems[i].type !== 'undefined'  &&  contextMenuItems[i].type === 'separator'
                                ? 'separator'
                                : 'normal',

                            parentId : typeof contextMenuItems[i].parentId !== 'undefined'
                                ? 'RIGHT-'+contextMenuItems[i].parentId
                                : null
                        },
                        menuCallback
                    );
                }
            }
        });
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
            console.info('Env.setupBadge(): tab url is not http type (probably system page). Exit');
            return;
        }

        if ( !context.color )   {
            console.warn('Env.setupBadge(): color not set. project / context: \n' + project.name + ' / ' + context.name);
            return;
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
                console.warn('Env.setupBadge(): Error executing code: \n' + chrome.runtime.lastError.message);
            }
            else {
                chrome.tabs.executeScript( tab.id, {

                    file: 'setBadge.js'

                }, function() {

                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        console.warn('Error injecting badge script: \n' + chrome.runtime.lastError.message);
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
            console.info('Env.setupFavicon(): tab url is not http type (probably system page). Exit');
            return;
        }

        if ( !context.color )   {
            console.warn('Env.setupFavicon(): color not set. project / context: \n' + project.name + ' / ' + context.name);
            return;
        }

        chrome.tabs.executeScript( null, {

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
                console.warn('Env.setupFavicon(): Error executing code: \n' + chrome.runtime.lastError.message);
            }
            else {
                chrome.tabs.executeScript( null, {

                    file: 'setFavicon.js'

                }, function() {

                    // on system pages you can't inject any scripts
                    if ( chrome.runtime.lastError ) {
                        console.warn('Error injecting favicon script: \n' + chrome.runtime.lastError.message);
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
                    path : "Icons/icon-48-act.png",
                    tabId: tabId
                });
                break;

            default:
                chrome.browserAction.setIcon({
                    path : "Icons/icon-48.png",
                    tabId: tabId
                });
        }
    }

};





/**
 * The whole magic
 */
chrome.storage.sync.get( null, function(options) {

        // exit now, if whole env functionality is disabled
        if ( typeof options.env_enable !== 'undefined'  &&  options.env_enable === false )
            return;

        Env.options = options;     // store to use in onclick
        Env.DEV = options.ext_debug;
        var projects = [];

        // version 2 means projects stored in separated items, with index. version 3 is items with unique id
        if (options.env_projects_storing_version === 3) {
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
        }
        // old for compatibility (version 1)
        else    {
            projects = options.env_projects;
        }

        Env.projectsAll = projects;
        Env.initProject();


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
            var idParts = info.menuItemId.split(/-/);
            var itemType = idParts[1];
            var itemIndex = idParts[2];
            var itemSubType = idParts[3];
            var itemSubIndex = idParts[4];

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


            // handle project-related items

            var project = typeof Env.projectsAll[ itemIndex ] !== 'undefined' ? Env.projectsAll[ itemIndex ] : {};
            console.log(project);
            console.log(itemSubType);

            if ( typeof project === 'undefined'  &&  itemSubType !== 'shortcustom')   {
                console.groupEnd();
                return;
            }

            
            
            if ( itemType === 'allprojects_project' )  {

                if (  itemSubType === 'env'  &&  typeof project.contexts[ itemSubIndex ]  !==  'undefined' )    {
                    console.info(':: OPEN TAB [allprojects: '+project.name+', env: '+project.contexts[ itemSubIndex ].name+'] & EXIT: ' + project.contexts[ itemSubIndex ].url);
                    chrome.tabs.create({
                        'url' :     project.contexts[ itemSubIndex ].url,
                        'index' :   tab.index + 1
                    });
                }
                else if ( itemSubType === 'link'  &&  typeof project.links[ itemSubIndex ]  !==  'undefined' )    {
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

            if ( itemType === 'project'  &&  itemSubType === 'link'  &&  typeof project.links[ itemSubIndex ]  !==  'undefined' )  {
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

                var activeContext = {};

                // look for current context (for base url replace)
                if ( typeof project.contexts !== 'undefined' )    {
                    for ( var c = 0;  c < project.contexts.length;  c++ ) {

                        var context = project.contexts[c];

                        if ( context.url  &&  tab.url.match( context.url ) )  {
                            activeContext = context;
                            console.log(':: PRE-SWITCH: active context found');
                            console.groupEnd();
                        }
                    }
                }
                

                if ( itemSubType === 'shortcustom'  &&  itemSubIndex === '1') {
                    Switcher.openCustomShortcut( typeof activeContext.url !== 'undefined' ? activeContext.url : '', options.env_menu_short_custom1, '1' );
                    return;
                }

                if ( itemSubType === 'shortcustom'  &&  itemSubIndex === '2') {
                    Switcher.openCustomShortcut( typeof activeContext.url !== 'undefined' ? activeContext.url : '', options.env_menu_short_custom2, '2' );
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
