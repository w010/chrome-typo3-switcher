/**
 * TYPO3 Backend Switcher - Chrome extension
 *
 * It works well with TYPO3 installations inside subdirectories, because it bases on base href.
 * If base tag is not found in frontend, it builds backend url from current domain.
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

console.log('contextMenu.js loaded');




// icon submenu


// todo: option for disabling this whole context menu functionality
// todo: change name of this script to environment.js
// todo: change this file to class


var _options;

// for performance, get all project options once to not read them on every tab switch
chrome.storage.sync.get( 'env_projects',
    function(options) {

        _options = options;     // store to use in onclick
        initProject( options );
});


/**
 * find current url in projects options. if found - set new menu and badge. otherwise exit
 */
function initProject(options)  {

    console.log('options.env_projects', options.env_projects);

    // switch window
    chrome.tabs.onHighlighted.addListener(function (){
        //console.log('tabs.onHighlighted');
        findProjectConfigForCurrentTabUrl(options);
    });
    // switch tab
    chrome.windows.onFocusChanged.addListener(function (){
        //console.log('windows.onFocusChanged');
        findProjectConfigForCurrentTabUrl(options);
    });
    // load page
    chrome.tabs.onUpdated.addListener(function (){
        //console.log('tabs.onUpdated');
        findProjectConfigForCurrentTabUrl(options);
    });
}



function findProjectConfigForCurrentTabUrl(options)   {

    // clear current options
    // todo: check, if this is sure
    chrome.contextMenus.removeAll(function()    {

        console.log('REMOVE ALL ITEMS');

        // gets current tab with details (tab from events only returns id)
        chrome.tabs.getSelected(null, function(tab) {
            //console.log(tab);

            var isProjectFound = false;

            // setup new ones, if url found in config
            if (typeof options.env_projects !== 'undefined')    {
                for (var p = 0; p < options.env_projects.length; p++)    {

                    var project = options.env_projects[p];
                    //console.log(project);

                    /*if (project.hidden)
                     continue;*/

                    if (typeof project.contexts !== 'undefined')    {
                        for (var c = 0; c < project.contexts.length; c++) {

                            var context = project.contexts[c];
                            //console.log(context);

                            /*if (context.hidden)
                             continue;*/

                            if (context.url  &&  tab.url.match( context.url ))  {

                                isProjectFound = true;

                                //console.info('url matched: ', context.url);
                                console.info('project: ', project.name, ', context: ', context.name);

                                setupIconMenu( context, project );
                                // todo: badge (if once set, try to not add again) - try to save info in tab object. is it possible?
                                //setupBadge( context, project );
                            }
                        }
                    }

                    if (isProjectFound) {

                        // todo: display separator and links

                        return;
                    }
                }
            }
        });
    });
}



/**
 * Add to submenu all contexts of a project
 * @param activeContext
 * @param project
 */
function setupIconMenu( activeContext, project )  {
    //console.log(project);

    chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT = 10;

    if (typeof project.contexts !== 'undefined') {
        for (var c = 0; c < project.contexts.length; c++) {

            var context = project.contexts[c],
                mark = activeContext.name === context.name ? '-> ' : '';

            chrome.contextMenus.create({
                title: mark + context.name,
                contexts: ["browser_action", "page"],
                id: 'env'+c

                //onclick: function,
                //type: "normal",  // default value
                //"id": "parent",  // for submenu
                //"parentId": "parent"
            });

        }
    }
}



/**
 * Handle menu items onclick (the only way to pass params)
 */
chrome.contextMenus.onClicked.addListener(function(info, tab) {

    // console.log(info);
    // console.log(tab);
    // console.log(_options);
    var menuItemIndex = +info.menuItemId.match( /\d+/g ).join([]);  // + casts matched digit to number

    console.log(menuItemIndex);

    chrome.tabs.getSelected(null, function(tab) {
        //console.log(tab);

        // console.log(menuItemIndex);

        var activeProject,
            activeContext,
            newContext;

            // setup new ones, if url found in config
        if (typeof _options.env_projects !== 'undefined')    {
            for (var p = 0; p < _options.env_projects.length; p++)    {

                var project = _options.env_projects[p];

                if (typeof project.contexts !== 'undefined')    {

                    for (var c = 0; c < project.contexts.length; c++) {

                        var context = project.contexts[c];

                        if (c === menuItemIndex)    {
                            newContext = context;
                            console.log('context selection index found');
                        }
                        if (context.url  &&  tab.url.match( context.url ))  {
                            activeProject = project;
                            activeContext = context;
                            console.log('active project & active context found');
                        }
                        if (newContext  &&  newContext === activeContext)   {
                            console.log('current context clicked: do nothing');
                            return;
                        }
                    }
                }

                if (activeProject)  {
                    console.log('active project found, so dont iterate next');
                    break;
                }
            }
        }

        switchEnvironment( newContext, activeContext, activeProject);
    });

});




/**
 * Switch to selected context environment - open tab with different host
 */
function switchEnvironment(newContext, activeContext, activeProject)    {
    // todo: option to choose whether to open context in new tab, or replace (maybe checkbox in menu?)

    console.log('SWITCH ENV!');
    console.log(newContext);
    console.log(activeContext);

    // params2.pageUrl is a key in object passed to this func? not passed, so get it
    chrome.tabs.getSelected(null, function(_currentTab) {
        console.log(_currentTab);

        // strip trailing slash
        var activeContextBaseUrl = activeContext.url.replace(/\/$/, '');
        var newContextBaseUrl = newContext.url.replace(/\/$/, '');

        console.log(activeContextBaseUrl);
        console.log(newContextBaseUrl);

        var newTabUrl = _currentTab.url.replace( activeContextBaseUrl, newContextBaseUrl );

        console.log(newTabUrl);

        // finally open TYPO3 Backend tab next to current page:
        chrome.tabs.create({
            'url': newTabUrl,
            'index': _currentTab.index + 1
        });
    });


    //console.log(params);
}




// in case of error adding context menu position: use chrome.runtime.lastError in callback