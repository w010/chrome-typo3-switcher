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

    DEV: Switcher.DEV,

    _options: null,



    /**
     * find current url in projects options. if found - set new menu and badge. otherwise exit
     */
    initProject : function(options)   {

        console.log('options.env_projects', options.env_projects);

        // switch window
        chrome.tabs.onHighlighted.addListener( function () {
            console.log('EVENT: tabs.onHighlighted');
            Env.findAndApplyProjectConfigForCurrentTabUrl( options, 'onHighlighted' );
        });
        // switch tab
        chrome.windows.onFocusChanged.addListener( function () {
            console.log('EVENT: windows.onFocusChanged');
            Env.findAndApplyProjectConfigForCurrentTabUrl( options, 'onFocusChanged' );
        });
        // load page
        chrome.tabs.onUpdated.addListener( function () {
            console.log('EVENT: tabs.onUpdated');
            Env.findAndApplyProjectConfigForCurrentTabUrl( options, 'onUpdated' );
        });
    },



    findAndApplyProjectConfigForCurrentTabUrl : function(options, _debugEventTriggered) {

        // clear current options
        // todo: check, if this is sure
        chrome.contextMenus.removeAll( function () {

            console.log('REMOVED ALL ITEMS');
            console.log('- Add new menu items: (should be after remove has finished)');

            // gets current tab with details (tab from events only returns id)
            chrome.tabs.getSelected( null, function (tab) {
                //console.log(tab);

                var isProjectFound = false;

                // setup new ones, if url found in config
                if ( typeof options.env_projects !== 'undefined' ) {
                    for ( var p = 0;  p < options.env_projects.length;  p++ ) {

                        var project = options.env_projects[p];
                        console.log(isProjectFound);
                        console.log(project);

                        if ( project.hidden )
                            continue;



                        if ( typeof project.contexts !== 'undefined' ) {
                            for ( var c = 0;  c < project.contexts.length;  c++ ) {

                                var context = project.contexts[c];
                                console.log(context);
                                //console.log(tab.url.match( context.url ));

                                if ( context.hidden )
                                    continue;

                                if ( context.url  &&  tab.url.match( context.url ) ) {

                                    isProjectFound = true;

                                    console.info('project: ', project.name, ', context: ', context.name);

                                    // exit now, if whole env functionality is disabled
                                    if ( options.env_switching !== false )
                                        Env.setupContextMenu( context, project, _debugEventTriggered );
                                    if ( options.env_badge !== false )
                                        Env.setupBadge( context, project, tab, _debugEventTriggered );

                                    break;
                                }
                            }
                        }

                        if ( isProjectFound ) {

                            // todo: display separator and links

                            console.info('ADD LINKS');

                            return;
                        }
                    }
                }
            });
        });
    },


    /**
     * Add to submenu all contexts of a project
     * @param activeContext
     * @param project
     */
    setupContextMenu : function(activeContext, project, _debugEventTriggered) {

        chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT = 10;

        if ( typeof project.contexts !== 'undefined' ) {
            for ( var c = 0;  c < project.contexts.length;  c++ ) {

                var context = project.contexts[c],
                    mark = activeContext.name === context.name  ?  '-> '  :  '';

                if ( context.hidden )
                    continue;

                chrome.contextMenus.create({
                    title:      mark + context.name,
                    contexts:   [ "browser_action", "page" ],
                    id:         'env' + c

                    //onclick: function,
                    //type: "normal",  // default value
                    //"id": "parent",  // for submenu
                    //"parentId": "parent"
                }, function () {
                    if ( chrome.runtime.lastError ) {
                        console.warn('Error: Probably duplicated url for various projects. Project: ' + project.name);
                        console.error(chrome.runtime.lastError.message);
                    }
                });
            }
        }
    },



    setupBadge : function (context, project, tab, _debugEventTriggered) {

        if ( !context.color )
            return;

        chrome.tabs.executeScript( null, {

            code: 'var badge_params = {' +
                    'DEV: '+Env.DEV+',' +
                    'projectLabel: "'+project.name+'",' +
                    'contextLabel: "'+context.name+'",' +
                    'contextColor: "'+context.color+'",' +
                    'projectLabelDisplay: '+( typeof Env._options.env_badge_projectname === 'undefined'  ||  Env._options.env_badge_projectname === true  ?  'true'  :  'false' )+',' +
                    'scale: '+( typeof Env._options.env_badge_scale !== 'undefined'  ?  parseFloat( Env._options.env_badge_scale )  :  1.0 )+',' +
                    'position: "'+( typeof Env._options.env_badge_position !== 'undefined'  ?  Env._options.env_badge_position  :  'left' )+'",' +
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
     * Switch to selected context environment - open tab with current subpage and different host
     */
    switchEnvironment : function(newContext, activeContext, activeProject) {
        // todo: option to choose whether to open context in new tab, or replace (maybe checkbox in menu?)

        console.log('SWITCH ENV!');
        console.log(newContext);
        console.log(activeContext);

        // params2.pageUrl is a key in object passed to this func? not passed, so get it
        chrome.tabs.getSelected( null, function (_currentTab) {
            console.log(_currentTab);

            // strip trailing slash
            var activeContextBaseUrl = activeContext.url.replace( /\/$/, '' );
            var newContextBaseUrl = newContext.url.replace( /\/$/, '' );

            console.log(activeContextBaseUrl);
            console.log(newContextBaseUrl);

            var newTabUrl = _currentTab.url.replace( activeContextBaseUrl, newContextBaseUrl );

            console.log(newTabUrl);

            // finally open TYPO3 Backend tab next to current page:
            chrome.tabs.create({
                'url':      newTabUrl,
                'index':    _currentTab.index + 1
            });
        });


        //console.log(params);
    }

};





/**
 * The whole magic
 */
chrome.storage.sync.get( null, function(options) {

        // exit now, if whole env functionality is disabled
        if ( typeof options.env_enable !== 'undefined'  &&  options.env_enable === false )
            return;

        Env._options = options;     // store to use in onclick
        Env.initProject( options );



        /**
         * Handle menu items onclick (the only way to pass params)
         */
        chrome.contextMenus.onClicked.addListener(function(info, tab) {

            // console.log(info);
            // console.log(tab);
            // console.log(_options);
            var menuItemIndex = +info.menuItemId.match( /\d+/g ).join([]);  // + casts matched digit to number

            console.log(menuItemIndex);

            chrome.tabs.getSelected( null, function(tab) {
                //console.log(tab);

                // console.log(menuItemIndex);

                var activeProject,
                    activeContext,
                    newContext;

                    // setup new ones, if url found in config
                if ( typeof Env._options.env_projects !== 'undefined' )    {
                    for ( var p = 0;  p < Env._options.env_projects.length;  p++ )    {

                        var project = Env._options.env_projects[p];

                        if ( typeof project.contexts !== 'undefined' )    {

                            for ( var c = 0;  c < project.contexts.length;  c++ ) {

                                var context = project.contexts[c];

                                if ( c === menuItemIndex )    {
                                    newContext = context;
                                    console.log('context selection index found');
                                }
                                if ( context.url  &&  tab.url.match( context.url ) )  {
                                    activeProject = project;
                                    activeContext = context;
                                    console.log('active project & active context found');
                                }
                                if ( newContext  &&  newContext === activeContext )   {
                                    console.log('current context clicked: do nothing');
                                    return;
                                }
                            }
                        }

                        if ( activeProject )  {
                            console.log('active project found, so dont iterate next');
                            break;
                        }
                    }
                }

                Env.switchEnvironment( newContext, activeContext, activeProject );
            });

        });

});
