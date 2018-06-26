/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017
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

        console.log('options.env_projects_count', Env.options.env_projects_count);

        // switch tab
        chrome.tabs.onHighlighted.addListener( function () {
            console.log(': EVENT: tabs.onHighlighted');
            if (Env.lock)   {
                console.log( ': LOCKED!' );
                return;
            }
            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onHighlighted' );
        });
        // switch window
        chrome.windows.onFocusChanged.addListener( function () {
            console.log(': EVENT: windows.onFocusChanged');
            if (Env.lock)   {
                console.log( ': LOCKED!' );
                return;
            }
            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onFocusChanged' );
        });
        // load page
        chrome.tabs.onUpdated.addListener( function (tabId) {
            console.log(': EVENT: tabs.onUpdated');
            if (Env.lock)   {
                console.log( ': LOCKED!' );
                return;
            }
            Env.findAndApplyProjectConfigForCurrentTabUrl( Env.options, Env.projectsAll, 'onUpdated', tabId );
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

        Env.lock = true;
        var loadFavicon = _debugEventTriggered === 'onUpdated';
        console.group('Project context setup');
        console.info('--------------- PROJECT CONTEXT SETUP begin - find project for current url & clear menu [LOCK]');

        // clear current options
        chrome.contextMenus.removeAll( function () {

            console.log('-- CLEAN menu. MATCH url to project');

            // deactivate icon
            console.info('-- ICON: deactivate');
            Env.setActionIcon( '', tabId );

            // project and link not needed for now, disable to not hit storage write quota
            // chrome.storage.sync.set({'_currentProject': {}});
            // chrome.storage.sync.set({'_currentContext': {}});
            // chrome.storage.sync.set({'_currentLink': {}});

            // gets current tab with details (tab from events only returns id)
            chrome.tabs.getSelected( null, function (tab) {
                //console.log(tab);
                if (typeof tab === 'undefined') {
                    console.log('-- can\'t read tab (system?) - exit [ LOCK RELEASE ] ');
                    Env.lock = false;
                    return;
                }

                var isProjectFound = false;

                // todo: here read new way projects (or maybe before? where it's all called just after first storage read? and pass them here

                // setup new ones, if url found in config
                if ( typeof projectsAll !== 'undefined' ) {
                    for ( var p = 0;  p < projectsAll.length;  p++ ) {

                        var project = projectsAll[p];

                        if ( project.hidden )
                            continue;


                        if ( typeof project.contexts !== 'undefined' ) {
                            for ( var c = 0;  c < project.contexts.length;  c++ ) {

                                var context = project.contexts[c];

                                if ( context.hidden )
                                    continue;

                                if ( context.url  &&  tab.url.match( context.url ) ) {

                                    isProjectFound = true;

                                    console.info('--- FOUND project: ', project.name, ', context: ', context.name);

                                    //chrome.storage.sync.set({'_currentProject': project});
                                    //chrome.storage.sync.set({'_lastProject': project});     // for options autoscroll, not resetted on every setup
                                    //chrome.storage.sync.set({'_currentContext': context});

                                    console.info('--- ICON: activate');
                                    Env.setActionIcon( 'active', tabId );

                                    // exit now, if whole env functionality is disabled
                                    // todo: this should be checked on very beginning - not even come here. we don't handle situation to set badge or favicon without menu.
                                    if ( options.env_switching !== false )
                                        Env.setupContextMenu( context, p, project, _debugEventTriggered );
                                    if ( options.env_badge !== false )
                                        Env.setupBadge( context, project, tab, _debugEventTriggered );

                                    // todo: make sure, if options can be read simply or with typeof to not cause errors after update ext and no such option saved yet
                                    if ( ( typeof options.env_favicon === 'undefined'  ||  options.env_favicon === true )  &&  loadFavicon )    {
                                        console.log('%%% FAVICON %%% = event ' + _debugEventTriggered);
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

                                    //chrome.storage.sync.set({'_currentProject': project});
                                    //chrome.storage.sync.set({'_lastProject': project});     // for options autoscroll, not resetted on every setup
                                    //chrome.storage.sync.set({'_currentLink': link});

                                    console.info('--- ICON: activate');
                                    Env.setActionIcon( 'active', tabId );

                                    // exit now, if whole env functionality is disabled
                                    if ( options.env_switching !== false )
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

                // if project not found, release the lock
                console.log('- project not found - try to set All Projects menu, if enabled');
                Env.setupContextMenu( [], -1, [], _debugEventTriggered );
                console.log('-- exit [LOCK RELEASE]');
                console.groupEnd();
                Env.lock = false;
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

        console.log('---- SETUP context menu: ADD items');

        var contextMenuItems = [];
        var mark = '';
        var options = this.options;


        // -- ENVIRONMENTS (CONTEXTS)
        if ( typeof project.contexts !== 'undefined' ) {

            var c = 0;

            for ( c;  c < project.contexts.length;  c++ ) {

                var context = project.contexts[c];
                mark = activeContext.name === context.name && activeContext.url === context.url  ?  '-> '  :  '     ';

                if ( context.hidden )
                    continue;

                contextMenuItems.push({
                    title : mark + context.name,
                    id :    'project-' + p + '-env-' + c,
                    parentId :  'parent-contexts'
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
                    id :        'parent-contexts'
                });
            }
        }


        // -- LINKS
        if ( typeof project.links !== 'undefined' ) {

            var separatorAdded = false;
            var l = 0;

            for ( l;  l < project.links.length;  l++ ) {

                var link = project.links[l];
                mark = activeContext.name === link.name && activeContext.url === link.url  ?  '-> '  :  '     ';

                if ( link.hidden )
                    continue;

                // add separator on first (not hidden) item
                if ( !separatorAdded ) {
                    contextMenuItems.push({
                        // for action icon where we use submenus, we set parentId
                        // in that case this separator is not used.
                        // it's only for page context menu, where we don't use additional submenus
                        title :             '_separator-links',    // needed to not cause error later in iteration
                        id :                '_separator-links',    // needed to not cause error later in iteration
                        type :              'separator',
                        showForMenuType:    'rightClickOnly'
                    });
                    separatorAdded = true;
                }

                contextMenuItems.push({
                    title : mark + link.name,
                    id :    'project-' + p + '-link-' + l,
                    parentId :  'parent-links'
                });
            }

            // if any not hidden links
            if (l > 0)  {
                chrome.contextMenus.create({
                    title :     project.name + ': links',
                    contexts :  [ "browser_action" ],
                    id :        'parent-links'
                });
            }
        }


        // -- INSTALL TOOL
        if ( typeof options.env_menu_show_installtool !== 'undefined'  &&  options.env_menu_show_installtool === true  &&  p > -1 ) {

            contextMenuItems.push({
                title :             '_separator-install',
                id :                '_separator-install',
                type :              'separator',
                showForMenuType:    'rightClickOnly'
            });

            contextMenuItems.push({
                title : 'Install Tool',
                id :    'project-' + p + '-installtool-'
            });
        }


        // -- ALL PROJECTS
        if ( typeof options.env_menu_show_allprojects !== 'undefined'  &&  options.env_menu_show_allprojects === true ) {

            /*contextMenuItems.push({
                title :             '_separator-allprojects',
                id :                '_separator-allprojects',
                type :              'separator',
                showForMenuType :   'rightClickOnly'
            });*/

            contextMenuItems.push({
                title :             'All projects',
                id :                'parent-allprojects',
                showForMenuType :   'actionMenuOnly'
            });

            // iterate all projects and links
            if ( typeof Env.projectsAll !== 'undefined' ) {
                for ( var _p = 0;  _p < Env.projectsAll.length;  _p++ ) {
                    var _project = Env.projectsAll[_p];
                    if ( _project.hidden )
                        continue;
                    contextMenuItems.push({
                        title :             _project.name,
                        id :                'parent_allprojects_project-' + _p,
                        parentId :          'parent-allprojects',
                        showForMenuType :   'actionMenuOnly'
                    });
                    if ( typeof _project.contexts !== 'undefined' ) {
                        for ( var _c = 0;  _c < _project.contexts.length;  _c++ ) {
                            var _context = _project.contexts[_c];
                            if ( _context.hidden )
                                continue;
                            if ( _context.url ) {
                                contextMenuItems.push({
                                    title :             _context.name,
                                    id :                '_allprojects_project-' + _p + '-env-' + _c,
                                    parentId :          'parent_allprojects_project-' + _p,
                                    showForMenuType :   'actionMenuOnly'
                                });
                            }
                        }
                    }
                    /*if ( typeof _project.links !== 'undefined' ) {
                        for ( var _l = 0;  _l < _project.links.length;  _l++ ) {
                            var _link = _project.links[l];
                            if ( _link.hidden )
                                continue;
                            if ( _link.url ) {
                                contextMenuItems.push({
                                    title : _link.name,
                                    id :    'project-' + _p + '-link-' + _l,
                                    parentId :  'parent-allprojects'
                                });
                            }
                        }
                    }*/
                }
            }

        }



        // when item array ready,
        // BUILD THE MENU

        console.log('---- ITEMS: ', contextMenuItems);


        // set up context menu
        for ( var i = 0;  i < contextMenuItems.length;  i++ ) {

            //if (Env.DEV)    console.log(contextMenuItems[i]);

            var menuCallbackDefault = function () {
                if ( chrome.runtime.lastError ) {
                    console.warn('Error: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered);
                    console.error(chrome.runtime.lastError.message);
                }
            };

            // on last item
            var menuCallbackLast = function()   {
                if ( chrome.runtime.lastError ) {
                    console.warn('Error: Probably duplicated url for various projects. Project: ' + project.name + ', from event: ' + _debugEventTriggered);
                    console.error(chrome.runtime.lastError.message);
                }

                console.info('----- CONTEXT MENU: SUCCESS');

                // release the lock
                Env.lock = false;
                console.info('--------------- PROJECT CONTEXT SETUP END - exit [LOCK RELEASE]');
                console.groupEnd();
            };

            // ACTION ICON MENU
            if ( typeof contextMenuItems[i].showForMenuType === 'undefined'
                // don't show items dedicated only to right-click menu (like separators, when no submenus used there)
                ||  ( typeof contextMenuItems[i].showForMenuType !== 'undefined'  &&  contextMenuItems[i].showForMenuType !== 'rightClickOnly' ) )  {

                chrome.contextMenus.create({
                    title :     contextMenuItems[i].title,
                    contexts :  [ "browser_action" ],
                    id :        contextMenuItems[i].id,
                    type :      typeof contextMenuItems[i].type !== 'undefined'  &&  contextMenuItems[i].type === 'separator'
                        ?  'separator'
                        :  'normal',
                    parentId:   typeof contextMenuItems[i].parentId !== 'undefined'
                        ?  contextMenuItems[i].parentId
                        : null
                },
                    menuCallbackDefault
                );
            }

            // PAGE RIGHT-CLICK MENU
            if ( typeof contextMenuItems[i].showForMenuType === 'undefined'
                // don't show items dedicated only to right-click menu (like separators, when no submenus used there)
                ||  ( typeof contextMenuItems[i].showForMenuType !== 'undefined'  &&  contextMenuItems[i].showForMenuType !== 'actionMenuOnly' ) )  {

                chrome.contextMenus.create({
                    title :     contextMenuItems[i].title,
                    contexts :  [ "page", "frame", "selection", "link", "editable", "image", "video", "audio", "page_action" ],
                    id :        'pagerightclickmenu_'+contextMenuItems[i].id,
                    type :      typeof contextMenuItems[i].type !== 'undefined'  &&  contextMenuItems[i].type === 'separator'
                        ?  'separator'
                        :  'normal'
                    // no parentId by default - in this menu put all in one level
                    /*parentId :  typeof contextMenuItems[i].forceParentId !== 'undefined'  &&  typeof contextMenuItems[i].parentId !== 'undefined'
                        ?  typeof contextMenuItems[i].parentId
                        :  ''*/
                },
                    //( i+1 === contextMenuItems.length  ?  menuCallbackLast  :  menuCallbackDefault )
                    menuCallbackDefault
                );
            }
            // is this working well like that? release lock here, instead of in callback of last item create?
            // no idea, how to do this better - some items are created conditionally and could never release the lock
            if (i+1 === contextMenuItems.length)
                menuCallbackLast();
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

        if ( !context.color )   {
            console.warn('Env.setupBadge(): color not set. project / context: \n' + project.name + ' / ' + context.name);
            return;
        }

        chrome.tabs.executeScript( null, {

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
                chrome.tabs.executeScript( null, {

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

        if ( !context.color )   {
            console.warn('Env.setupFavicon(): color not set. project / context: \n' + project.name + ' / ' + context.name);
            return;
        }

        chrome.tabs.executeScript( null, {

            code: 'var favicon_params = {' +
                    'DEV: '+Env.DEV+',' +
                    'contextColor: "'+context.color+'",' +
                    //'scale: '+( typeof Env.options.env_badge_scale !== 'undefined'  ?  parseFloat( Env.options.env_badge_scale )  :  1.0 )+',' +
                    //'position: "'+( typeof Env.options.env_badge_position !== 'undefined'  ?  Env.options.env_badge_position  :  'left' )+'",' +
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
        chrome.tabs.getSelected( null, function (_currentTab) {

            var newTabUrl = '';

            // if we are on project's link, not context, we may not get activeContext
            if ( typeof activeContext !== 'undefined' )  {
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
        var projectsAll = [];

        // if count is saved, it means the separated projects save method is used / after migration
        if (options.env_projects_count) {
            // extract projects
            var i;
            for (i = 0; i < options.env_projects_count; i++) {
                projectsAll.push(options['proj_' + i]);
            }
        }
        // old for compatibility
        else    {
            projectsAll = options.env_projects;
        }

        Env.projectsAll = projectsAll;
        Env.initProject();


        /**
         * Handle menu items onclick (the only way to pass params)
         */
        chrome.contextMenus.onClicked.addListener(function(info, tab) {

            // console.log(info);
            // console.log(tab);
            // console.log(Env.options);

            // extract necessary info from button id
            var idParts = info.menuItemId.split(/-/);
            var projectIndex = idParts[1];
            var itemType = idParts[2];
            var itemIndex = idParts[3];

            console.group('open tab. menu position params:');
            console.log({menuPositionUniqueId: idParts[0], projectIndex: projectIndex, itemType: itemType, itemIndex: itemIndex});
            //console.log(idParts);

            var project = Env.projectsAll[ projectIndex ];
            console.log(project);

            if ( typeof project === 'undefined' )   {
                console.groupEnd();
                return;
            }



            // menu position: LINK

            if ( typeof itemType !== 'undefined'  &&  itemType === 'link'  &&  typeof project.links[ itemIndex ]  !==  'undefined' )  {
                //console.log(project.links[ itemIndex ]);

                console.info(':: OPEN TAB [LINK] & EXIT: ' + project.links[ itemIndex ].url);
                console.groupEnd();

                chrome.tabs.create({
                    'url' :     project.links[ itemIndex ].url,
                    'index' :   tab.index + 1
                });

                return;
            }


            // menu position: ENV / CONTEXT
            // menu position: INSTALL TOOL

            var newContext = project.contexts[ itemIndex ];
            //console.log(newContext);

            if ( typeof newContext === 'undefined'  &&  itemType !== 'installtool') {
                console.warn('error - no such context set in menu? context index: ' + itemIndex);
                console.groupEnd();
                return;
            }

            chrome.tabs.getSelected( null, function(tab) {
                //console.log(tab);

                var activeContext;

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

                if (itemType === 'installtool') {
                    Switcher.openInstallTool( activeContext.url );
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
