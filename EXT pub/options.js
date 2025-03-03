/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017-2025
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Options screen script
 * @see https://developer.chrome.com/extensions/optionsV2
 */





const ExtOptions = {

    DEV: false,
    DEBUG: 0,
    options: {},

    /* stores which dialog is the "active" one, when more than one is open at once (submodals) - usually this handles
    which is the one to close on esc key hit */
    // now stack an array and pop when used
    dialogsOpenStack: [],

    // To handle some minor browser differences
    engine: 'webkit',

    consoleColor: {},


    init: function()    {
        // browser simple detection
        if ( typeof browser !== 'undefined' )   {
            ExtOptions.engine = 'gecko';
            $('body').addClass('firefox');
            ExtOptions.consoleColor = {
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
            $('body').addClass('chrome');
            ExtOptions.consoleColor = {
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
     * Saves options to chrome.storage.sync.
     */
    optionsSave: function( trigger ) {

        let flashFeedback = true,
            $autosorting = $( '#env_projects_autosorting' )
        if ( typeof trigger === 'object' )  {
            // trigger node may have some additional save config
            if ( $(trigger.target ).hasClass( 'no-flash' ) )    {
                flashFeedback = false;
            }
        }

        // sort projects - I think it's best to run sorting at this stage
        if ( $autosorting.is( ':checked' ) ) {
            let sortedProjects = $( '.projects-container .projectItem' ).sort(function(a, b) {
                return $(a).find( '[name="project[name]"]' ).val().toUpperCase().localeCompare( 
                    $(b).find( '[name="project[name]"]' ).val().toUpperCase() );
            });
            sortedProjects.appendTo( $( '.projects-container' ) );

            // scroll to the current project, if name changed it might have been moved in other sort position, so catch the form
            let focusedProject = $( '.projectItem.active-focus' );
            if ( focusedProject  &&  focusedProject?.length )  {

                // scroll position + port height = [max offset from top for the item visible above bottom screen end].
                // - minus item actual offset = more than ~150px  
                let isProjectVisibleInViewport_factor_top = ( $(window).scrollTop() + window.innerHeight )  -  (focusedProject?.offset()?.top ?? 0);

                // scroll position - minus item real offset  + 100 page padding correction - minus item height =  
                // = least than -150 px to not hide above top border.
                let isProjectVisibleInViewport_factor_bottom = ( $(window).scrollTop() - focusedProject?.offset()?.top ?? 0 ) - (focusedProject?.outerHeight() ?? 0) + 100;

                if ( isProjectVisibleInViewport_factor_top >= 200  &&  isProjectVisibleInViewport_factor_bottom <= -250 )   {
                    console.log( 'Visible well - inside viewport whole or in most part' );
                }
                else    {
                    console.log( 'Probably mostly or whole beyond viewport! Should scroll' );
                    // console.log( isProjectVisibleInViewport_factor_top );
                    // console.log( isProjectVisibleInViewport_factor_bottom );
                    focusedProject.removeClass('collapse');
                    $('html,body').animate({scrollTop: $(focusedProject)?.offset()?.top ?? 0 - 150}, 400);
                }
            }
        }
        
        // marks new, finds duplicates, scrolls to them
        ExtOptions.checkItems();

        let projects = ExtOptions.collectProjects();
        // causes problems in firefox - restricts this only on explicit user action (what is a save-button click then...?)
        /*if ( trigger.type === 'click' ) {
            ExtOptions.requestPermissions( projects );
        }*/


        let options = {
            'switch_fe_openSelectedPageUid':    $( '#switch_fe_openSelectedPageUid' ).is( ':checked' ),
            'switch_be_useBaseHref':            $( '#switch_be_useBaseHref' ).is( ':checked' ),
            'env_enable':                       $( '#env_enable' ).is( ':checked' ),
            'env_ignore_www':                   $( '#env_ignore_www' ).is( ':checked' ),
            'env_menu_show_allprojects':        $( '#env_menu_show_allprojects' ).is( ':checked' ),
            'env_menu_short_custom1':           $( '#env_menu_short_custom1' ).val(),
            'env_menu_short_custom2':           $( '#env_menu_short_custom2' ).val(),
            'env_badge':                        $( '#env_badge' ).is( ':checked' ),
            'env_badge_projectname':            $( '#env_badge_projectname' ).is( ':checked' ),
            'env_badge_position':               $( '#env_badge_position_right' ).is( ':checked' )  ?  'right'  :  'left',
            'env_badge_scale':                  $( '#env_badge_scale' ).val(),
            'env_favicon':                      $( '#env_favicon' ).is( ':checked' ),
            'env_favicon_alpha':                $( '#env_favicon_alpha' ).val(),
            'env_favicon_fill':                 $( '#env_favicon_fill' ).val(),
            'env_favicon_position':             $( '#env_favicon_position' ).val(),
            'env_favicon_composite':            $( '#env_favicon_composite' ).val(),
            'env_projects_autosorting':         $autosorting.is( ':checked' ),
            'ext_dev':                          $( '#ext_dev' ).is( ':checked' ),
            'ext_debug':                        $( '#ext_debug' ).val(),
            'ext_dark_mode':					$( '#ext_dark_mode' ).is( ':checked' ),
            'ext_hide_help':                    $( '#ext_hide_help' ).val(),
            //'ext_backend_path':                  $( '#ext_backend_path' ).val(),
            'env_repo':                         $( '#env_repo' ).is( ':checked' ),
            'env_repo_url':                     $( '#env_repo_url' ).val(),
            'env_repo_key':                     $( '#env_repo_key' ).val(),
            'env_projects_storing_version':     3,
            'internal_permissions_acknowledged': true,
            'info_manifest3_acknowledged':       true,
        };


        chrome.storage.sync.set( options, function() {

            // in case of problems show info and end operation
            if (chrome.runtime.lastError)   {
                ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, 'error', null, 100000 );
            }
            // if options saved ok, now save projects
            else    {
                ExtOptions.options = options;
                ExtOptions.handleDarkMode();

                chrome.storage.sync.set(

                    projects

                , () => {
                    // update storage info
                    ExtOptions.updateStorageInfo();
                    ExtOptions.debugStorageData();
                    ExtOptions.fillExportData();

                    // update status message and show error if any
                    if (chrome.runtime.lastError)   {
                        ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, 'error', null, 100000 );
                    }
                    else    {
                        ExtOptions.displayMessage( 'Options saved.', 'success' );
                        // blink window after saveflashContainer
                        if ( flashFeedback )    {
                            $('body').addClass('flashContainer');
                            setTimeout(() => { $('body').removeClass('flashContainer'); }, 1000);
                        }
                    }

                    // reload extension to reapply settings
                        // not possible anymore like that. is this needed? then use messages
                    //chrome.extension.getBackgroundPage().window.location.reload();
                });
            }
        });
    },

    /**
     * Restores select box and checkbox state using the preferences
     * stored in chrome.storage
     */
    optionsRestore: function() {

        let darkModeSystemDetected = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        chrome.storage.sync.get({

            // Set default values on read if not found
            'switch_fe_openSelectedPageUid':    true,
            'switch_be_useBaseHref':            true,
            'env_projects':                     [],     // leave for compatibility - must try to read old projects array to migrate
            'env_projects_storing_version':     3,      // version 1 is original all-projects-one-key method. version 2 means projects stored in separated items, with index and counter. version 3 is items with unique id
            'env_projects_autosorting':         false,
            'env_enable':                       true,
            'env_ignore_www':                   true,
            'env_menu_show_allprojects':        true,
            'env_menu_short_custom1':           '/typo3/install.php | - Install Tool',
            'env_menu_short_custom2':           '',
            'env_badge':                        true,
            'env_badge_projectname':            true,
            'env_badge_position':               'right',
            'env_badge_scale':                  '1.0',
            'env_favicon':                      true,
            'env_favicon_alpha':                '0.85',
            'env_favicon_fill':                 '0.25',
            'env_favicon_position':             'bottom',
            'env_favicon_composite':            'source-over',
            'ext_backend_path':                 'typo3',
            'ext_dev':                          false,
            'ext_debug':                        0,
            'ext_dark_mode':                    darkModeSystemDetected,
            'ext_hide_help':                    false,
            'env_repo':                         false,
            'env_repo_url':                     '',
            'env_repo_key':                     '',
            // after updating to the version where the per-host permissions are introduced, it requires going once to the options and call Save
            // - to trigger permission request for each of hosts found in user's projects. this keeps the state it's already done or not needed. state is used to display a notification about that.
            'internal_permissions_acknowledged': false,
            'info_manifest3_acknowledged':       false,
            'info_be_preselection_acknowledged': false,

        }, function(options) {

            let loadingTransitionDelay = setTimeout(function(){
                clearTimeout(loadingTransitionDelay);
                $( 'body' ).removeClass('loading');
            }, 100);

            // cast to int - for update reasons - ext_debug was previously bool. remove in future
            options.ext_debug = + options.ext_debug;

            $( '#switch_fe_openSelectedPageUid' ).attr( 'checked',  options.switch_fe_openSelectedPageUid );
            $( '#switch_be_useBaseHref' ).attr( 'checked',          options.switch_be_useBaseHref );
            $( '#env_enable' ).attr( 'checked',                     options.env_enable );
            $( '#env_ignore_www' ).attr( 'checked',                 options.env_ignore_www );
            $( '#env_menu_show_allprojects' ).attr( 'checked',      options.env_menu_show_allprojects );
            $( '#env_menu_short_custom1' ).val('' +                 options.env_menu_short_custom1 );
            $( '#env_menu_short_custom2' ).val('' +                 options.env_menu_short_custom2 );
            $( '#env_badge' ).attr( 'checked',                      options.env_badge );
            $( '#env_badge_projectname' ).attr( 'checked',          options.env_badge_projectname );
            $( '#env_badge_position_left' ).attr( 'checked',        options.env_badge_position === 'left' );
            $( '#env_badge_position_right' ).attr( 'checked',       options.env_badge_position === 'right' );
            $( '#env_badge_scale' ).val(                            options.env_badge_scale );
            $( '#env_badge_scale__range' ).val(                     options.env_badge_scale );
            $( '#env_favicon' ).attr( 'checked',                    options.env_favicon );
            $( '#env_favicon_alpha' ).val(                          options.env_favicon_alpha );
            $( '#env_favicon_alpha__range' ).val(                   options.env_favicon_alpha );
            $( '#env_favicon_fill' ).val(                           options.env_favicon_fill );
            $( '#env_favicon_fill__range' ).val(                    options.env_favicon_fill );
            $( '#env_favicon_position' ).val(                       options.env_favicon_position );
            $( '#env_favicon_composite' ).val(                      options.env_favicon_composite );
            $( '#env_projects_autosorting' ).attr( 'checked',       options.env_projects_autosorting );
            $( '#ext_dev' ).attr( 'checked',                        options.ext_dev );
            $( '#ext_debug' ).val(                                  options.ext_debug );
            $( '#ext_dark_mode' ).attr( 'checked',                  options.ext_dark_mode );
            $( '#ext_hide_help' ).val(                              options.ext_hide_help );
            $( '#env_repo' ).attr( 'checked',                       options.env_repo );
            $( '#env_repo_url' ).val(                               options.env_repo_url ).trigger('change');   // describe why trigger
            $( '#env_repo_key' ).val(                               options.env_repo_key );

            ExtOptions.DEV = options.ext_dev;
            ExtOptions.DEBUG = options.ext_debug; 
            ExtOptions.options = options;

            ExtOptions.permissionsInfo();
            ExtOptions.backendPreselectionInfo();    // temporary message
            ExtOptions.manifestUpdateInfo();    // temporary message

            ExtOptions.initFoldableSections();
            ExtOptions.handleDarkMode();

            ExtOptions.setFaviconPreview();
            ExtOptions.setBadgePreview(options.env_badge);

            // new project store way is 3, so it means it's after migration
            if (options.env_projects_storing_version === 3) {
                // read all options and extract projects
                // read them separately from above, to keep possibility to set defaults on read
                chrome.storage.sync.get(null, function(allOptions)    {
                    var projects = [];
                    
                    $.each(allOptions, function(key, value)    {
                        if (key.match(/^project_/g)) {
                            // if, for some reason, project doesn't have a uuid, take it from key
                            if (typeof allOptions[key].uuid === 'undefined')
                                allOptions[key].uuid = key.replace(/^project_+/g, '');
                            projects.push(allOptions[key]);
                        }
                    });

                    ExtOptions.populateEnvSettings( projects );
                    ExtOptions.fillExportData();
                    
                    // if urlAddEdit came, handle it on load
                    chrome.storage.local.get({ 'urlAddEdit': '' }, function(local) {
                        if ( local.urlAddEdit ) {
                            
                            ExtOptions.handleAddEditUrl( local.urlAddEdit );
                            
                            // remove the url after use
                            chrome.storage.local.set({ 'urlAddEdit': '' }, function() {});
                        }
                    });
                });
            }
            // for migration, try to read projects using method 1 (omit version 2, it was only used for tests in unpublished version) 
            else    {
                ExtOptions.populateEnvSettings( options.env_projects );
                ExtOptions.fillExportData();
            }

            if ( options.ext_hide_help )   {
                $( 'body' ).addClass('hide-help');
                $( '#toggle_ext_hide_help' ).addClass('toggle_pressed');
            }

            ExtOptions.initCheckboxes();
            ExtOptions.debugStorageData();
            if ( ExtOptions.DEV )   {
                $( 'body' ).addClass('dev-mode');
            }
        });
    },


    /**
     * Handle incoming URL - find & open or propose to add
     */
    handleAddEditUrl : function(url)   {
        if (!url)   {
            return;
        }
        
        let urlParts = url.split(/\//); 
        let cleanedUrl = urlParts[0] + '//' + urlParts[2] + '/';
    
        // try to find and expand its project
        let projectsItemsSet = $('.projects-container .projectItem');
        let found = false;
    
        projectsItemsSet.each( function(index, item) {
            // search for the value in context urls
            $(this).find('[name="context[url]"]').each(function()  {
                
                // strip any trailing slash and then add one (make sure it ends with one, to match no matter if given or not in config)  
                let checkedContextUrl = $(this).val().replace('/\/^/', '') + '/';
                
                if ( checkedContextUrl.toLowerCase().indexOf( cleanedUrl ) >= 0 )  {
                    found = true;
    
                    // open project form and scroll to it
                    $(item).find('.toggle.project').trigger('click');
                    $(this).focus();
                    $('html,body').animate({scrollTop: $(item).offset().top - 100}, 300);
                    return;
                }
            });
    
            if (found)  {
                return;
            }
        });


        // if not in local projects, propose add options
        if ( !found )  {
            // open dialog asking to add to current / make new project / cancel

            let clipboardTheIncomingUrl = function ( inputSelector )   {
                // cannot select text in invisible elements
                let el = $(inputSelector);
                el.css('display', 'inline').select();
                document.execCommand("copy");
                el.css('display', 'none');

                // visual feedback                
                let url_value_el = el.parent().find('h3.url_value');
                url_value_el.addClass('blinkText');
                setTimeout(function() { url_value_el.removeClass('blinkText'); }, 250);
            }

            let finalUrlValue = '';


            // build url selector (raw or cleaned/domain)
            let urlSelector = $( '<div id="url_selector" class="row">' )
                .html( '<div class="col-6 col-option-cleaned"><div class="url_option option_cleaned default active"></div></div>' +
                       '<div class="col-6 col-option-raw"><div class="url_option option_raw"></div></div>' );

            let urlSelectorOptionChoose = function (el)    {
                $( '#url_selector .url_option' ).removeClass( 'active' );
                el.addClass( 'active' );
                finalUrlValue = el.find( '.url_value' ).text();
            };


            // option 1: cleaned url
            
                // keep url in hidden input to copy it to clipboard on url click. (selecting in text nodes doesn't work) 
            let urlCleanedValueLabel = $( '<h3 class="url_value">' ).html( cleanedUrl );
            let urlCleanedPlaceholder = $( '<input id="urlAddEdit_url_cleaned" style="display: none;">' ).val( cleanedUrl );
            let buttonClipboardUrlCleaned = $( '<button class="btn clipboard copyIncomingUrl_cleaned" title="Copy URL"><span class="icon"></span> </button>' );

            $(urlSelector).find( '.option_cleaned' )
                .append( '<p>Use cleaned / only domain:</p>' )
                .append( $(urlCleanedValueLabel) )
                .append( $(urlCleanedPlaceholder) )
                .click(function(){  urlSelectorOptionChoose( $(this) );    });

            $(urlSelector).find( '.col-option-cleaned' )
                .append( buttonClipboardUrlCleaned );
            
            
            
            // option 2: raw url
            
            let urlRawValueLabel = $( '<h3 class="url_value">' ).html( url );
            let urlRawPlaceholder = $( '<input id="urlAddEdit_url_raw" style="display: none;">' ).val( url );
            let buttonClipboardUrlRaw = $( '<button class="btn clipboard copyIncomingUrl_raw" title="Copy URL"><span class="icon"></span> </button>' );

            $(urlSelector).find('.option_raw')
                .append( '<p>Use raw address / whole as-is:</p>' )
                .append( $(urlRawValueLabel) )
                .append( $(urlRawPlaceholder) )
                .click(function(){  urlSelectorOptionChoose( $(this) );    });
            
            $(urlSelector).find( '.col-option-raw' )
                .append( buttonClipboardUrlRaw );
                


            let dialogContent = $( '<p>' ).html('Requested URL is <b>NOT YET</b> in your projects database. <br>What to do with it?' );

            let buttonNewProject = $( '<button class="btn add dialog_projectAdd"><span class="icon"></span> <span class="text">Create new PROJECT</span></button>' );
            let buttonNewContext = $( '<button class="btn add dialog_contextAdd"><span class="icon"></span> <span class="text">Add CONTEXT / LINK to existing one</span></button>' );
            let buttonCancel = $( '<button class="btn cancel"><span class="text" title="Close dialog and discard url">Do nothing & close</span></button>' );


            let dialog = ExtOptions.openDialog('New URL:', $( '<div>' )
                .append( urlSelector )
                .append( dialogContent )
                .append( buttonNewProject )
                .append( buttonNewContext )
                .append( buttonCancel )
            );
    
            

            // default initial before click any of them
            finalUrlValue = $( '.url_option.active .url_value' ).text();


            // make new PROJECT
            dialog.find('.dialog_projectAdd').click( function() {
                // open and prefill Add form
                var newProject = ExtOptions.insertProjectItem( {} )
                    .removeClass( 'collapse' )
                newProject.find( '.env_contextAdd' ).click();
                newProject.find( '[name="context[url]"]' )
                    .val( finalUrlValue )
                    .focus();

                ExtOptions.closeDialog( dialog );
            });
    
            
            // add CONTEXT
            dialog.find('.dialog_contextAdd').click( function() {
                $('#projectSelector').detach();
                // display project list/selector
                let projectSelector = $('<div id="projectSelector">')
                    .html('<h3 class="info">Choose project:</h3>');
                
                $.each(ExtOptions.getProjectsArray(), function(p, project){
                    let projectOptionItem = $('<div class="projectOptionItem" data-uuid="' + project.uuid + '">');
                   
                    projectOptionItem.append(
                        $('<p class="project-name">').html( project.name )
                    );
                    
                    let contextsBox = $('<div class="contexts-list">').appendTo( projectOptionItem );

                    $.each(project.contexts, function(c, context) {
                        contextsBox.append(
                            $('<p class="context">').html(
                                '<span class="name">' + context.name + ':</span>' +
                                '<span class="url">' + context.url + '</span>'
                            )
                        );
                    });

                    if (project.links.length)    {
                       contextsBox.append( '<hr>' );
                    }

                    $.each(project.links, function(c, link) {
                        contextsBox.append(
                            $('<p class="link">').html(
                                '<span class="name">' + link.name + ':</span>' +
                                '<span class="url">' + link.url + '</span>'
                            )
                        );
                    });

                    
                    let findAndExpandProject = function()   {
                        // hide modal, open project form and scroll to it
                        ExtOptions.closeDialog( dialog );
                        ExtOptions.collapseAllProjects();
                        let projectRealItem = $('#project_' + project.uuid);
                        $('html,body').animate({scrollTop: projectRealItem.offset().top - 100}, 300);
                        projectRealItem.find('.toggle.project').trigger('click');
                        return projectRealItem;
                    }
                    
                    // after choosing target project display mini dialog to decide - to add as context or as link

                    projectOptionItem
                        .appendTo( projectSelector )
                        .click(function(){
                            // correct selector item scroll position to make item fully visible - scroll to top of current item
                            let targetOffsetCorrection = projectSelector.scrollTop() + $(this).position().top + 2;
                            $(projectSelector).animate({scrollTop: targetOffsetCorrection}, 300);
                            
                            let contextOrLinkQuestionExists = $(this).find('.context-or-link');
                            if ( contextOrLinkQuestionExists.length )   {
                                contextOrLinkQuestionExists.remove();  // clean if clicked again
                            }
                            else    {
                                let contextOrLinkQuestion = $('<div class="context-or-link">')
                                    .append(
                                        $('<p>').html('Add as new server <b>context</b> / environment, or as a project related <b>link</b>?')
                                    )
                                    .append(
                                        $('<button class="btn add as-context"><span class="icon"></span> <span class="text">Add as CONTEXT</span></button>')
                                            .on('click', function(){
                                                let project = findAndExpandProject();
                                                let context = ExtOptions.insertContextItem( project, {} );
                                                context.find( '[name="context[url]"]' ).val( finalUrlValue ).focus();
                                            })
                                    )
                                    .append(
                                        $('<button class="btn add as-link"><span class="icon"></span> <span class="text">Add as LINK</span></button>')
                                            .on('click', function(){
                                                let project = findAndExpandProject();
                                                let link = ExtOptions.insertLinkItem( project, {} );
                                                link.find( '[name="link[url]"]' ).val( finalUrlValue ).focus();
                                        })
                                    );
                                contextOrLinkQuestion.appendTo( projectOptionItem );
                            }
                        });
                });
                
                dialog.find('.dialog-body').append( projectSelector );
                
                // scroll to it
                $(dialog.find('.dialog-inner')).animate({scrollTop: $('#url_selector').height()}, 300);
            });
            
            
            dialog.find('.copyIncomingUrl_cleaned').click(function () {
                clipboardTheIncomingUrl( '#urlAddEdit_url_cleaned' );
            });
            
            dialog.find('.copyIncomingUrl_raw').click(function () {
                clipboardTheIncomingUrl( '#urlAddEdit_url_raw' );
            });
            
            
            dialog.find('.cancel').click( function() {
                ExtOptions.closeDialog( dialog );
            });
        }
    },
    
    
    
    
    // ENV SETTINGS
    
    /**
     * Add project item block
     * @param projectItem object
     * @param classes string - additional classes to set to item
     */
    insertProjectItem : function(projectItem, classes)   {
        const project = $( '.projectItem._template' ).clone().removeClass( '_template' )
            .appendTo( $( '.projects-container' ) );
        
        // store project row in dom object. this way we can later  compare and detect that it was modified 
        project.prop('projectItem_lastReadData', projectItem);
        project.delegate('input', 'change paste keyup', (el) => {
            // todo: temporary, to see when it launches
            project.addClass('modified')
        });
        
        if (typeof classes === 'string')
            project.addClass( classes );

        if (typeof projectItem.uuid === 'undefined' || !projectItem.uuid)
            projectItem.uuid = makeRandomUuid(6);
        
        project.attr('id', 'project_' + projectItem.uuid);

        // populate data
        project.find( '[name="project[uuid]"]' ).val( projectItem.uuid );
        project.find( '[name="project[name]"]' ).val( projectItem.name );
        project.find( '[name="project[hidden]"]' ).prop( 'checked', projectItem.hidden );
        if ( projectItem.hidden )
            project.addClass( 'hidden' );

        if ( typeof projectItem.contexts !== 'undefined'  &&  projectItem.contexts.length ) {
            $.each( projectItem.contexts, function (i, contextItem) {
                ExtOptions.insertContextItem( project, contextItem );
            });
        }
        project.find( '.env_contextAddDefaultSet' ).css( 'display', 'inline-block' );

        if ( typeof projectItem.links !== 'undefined' &&  projectItem.links.length ) {
            $.each( projectItem.links, function (i, linkItem) {
                ExtOptions.insertLinkItem( project, linkItem );
            });
        }

        // bind buttons
        project.find( 'button.env_contextAdd' ).click( function() {
            const context = ExtOptions.insertContextItem( project, {} );
            context.find( '[name="context[name]"]' ).focus();
        });

        project.find( 'button.env_contextAddDefaultSet' ).click( function() {
            ExtOptions.insertDefaultContextSet( project );
        });

        project.find( 'button.env_linkAdd' ).click( function() {
            const link = ExtOptions.insertLinkItem( project, {} );
            link.find( '[name="link[name]"]' ).focus();
        });

        project.find( 'button.env_projectRemove' ).click( function() {
            const trigger = $(this);
			ExtOptions.confirmDialog( 'Delete project', 'Are you sure?',function() {
				ExtOptions.deleteProjectItem( trigger.closest('.projectItem') );
                //ExtOptions.optionsSave(); // probably is problematic to call it right after
            });
        });

        project.find( '> .hideItem input' ).on( 'change', function() {
            project.toggleClass( 'hidden' );
        });

        project.find( '.toggle.project' ).click( function() {
            project.toggleClass( 'collapse' );
        });

        project.find( 'button.env_projectExport' ).click( function() {
            ExtOptions.exportProjectsDownloadFile( project );
        });

        // make elements inside sortable
        project.find( '.contexts-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer', update: function() { ExtOptions.sortDropCallback(); } });
        project.find( '.links-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer', update: function() { ExtOptions.sortDropCallback() } });

        project.on( 'click', function() {
            $('.projectItem').removeClass('active-focus');
            project.addClass('active-focus');
        });

        // reinit nice checkboxes
        ExtOptions.initCheckboxes();

        return project;
    },

    /**
     * Add env context block
     * @param project element
     * @param contextItem object with data
     * @param append automatically append to its parent. allows to only create item & return to insert manually
     */
    insertContextItem : function(project, contextItem, append = true)   {
        const context = $( '.contextItem._template' ).clone().removeClass( '_template' );
        if (append)
            context.appendTo( project.find( '.contexts-container' ) );
        
        // default color when adding new empty context and not specify
        if ( !contextItem.color )   {
            contextItem.color = '#1499ff';
        }

        // populate data
        context.find( "[name='context[name]']" ).val( contextItem.name );
        context.find( "[name='context[url]']" ).val( contextItem.url );
        context.find( "[name='context[color]']" ).val( contextItem.color );
        context.find( ".color-picker" ).val( contextItem.color );
        context.find( "[name='context[hidden]']" ).prop( 'checked', contextItem.hidden );
        if ( contextItem.hidden )
            context.addClass( 'hidden' );

        // bind buttons
        context.find( 'button.env_contextRemove' ).click( function() {
            ExtOptions.confirmDialog( 'Delete context', 'Are you sure?', function() {
                ExtOptions.deleteContextItem( context, project );
                ExtOptions.optionsSave();
            });
        });

        context.find( '> .hideItem input' ).on( 'change', function() {
            context.toggleClass( 'hidden' );
        });

        context.find( '.btn.opentab' ).on('click', function() {
            window.open( contextItem.url, '_blank' );
        });

        // color picker - set text input
        context.find( 'input.color-picker' ).on( 'change', function() {
            //console.log('picker changed');
            context.find( 'input.color-text' ).val( $(this).val() );
        });
        // color input - set picker color
        context.find( 'input.color-text' ).on( 'keyup', function() {
            //console.log('color text changed');
            // add # on beginning if not there
            if ( !( /^#/.test( $(this).val() ) ) )
                $(this).val( '#' + $(this).val() );

            if ( $(this).val().length === 7 )
                context.find( 'input.color-picker' ).val( $(this).val() );
        });

        context.find( '.toggle.context' ).click( function() {
            context.toggleClass( 'collapse' );
        });

        // reinit nice checkboxes
        ExtOptions.initCheckboxes();

        return context;
    },

    /**
     * Add link block
     * @param project element
     * @param linkItem object with data
     */
    insertLinkItem: function(project, linkItem)   {
        let link = $( '.linkItem._template' ).clone().removeClass( '_template' )
            .appendTo( project.find( '.links-container' ) );

        // populate data
        link.find( "[name='link[name]']" ).val( linkItem.name );
        link.find( "[name='link[url]']" ).val( linkItem.url );
        link.find( "[name='link[hidden]']" ).prop( 'checked', linkItem.hidden );
        if ( linkItem.hidden )
            link.addClass( 'hidden' );

        // bind buttons
        link.find( 'button.env_linkRemove' ).click( function() {
            ExtOptions.confirmDialog( 'Delete link', 'Are you sure?', function() {
                ExtOptions.deleteLinkItem( link, project );
            });
        });
        link.find( '> .hideItem input' ).on( 'change', function() {
            link.toggleClass( 'hidden' );
        });
        
        link.find( '.btn.opentab' ).on('click', function() {
            window.open( linkItem.url, '_blank' );
        });

        // reinit nice checkboxes
        ExtOptions.initCheckboxes();

        return link;
    },


    /**
     * Add some default contexts
     * @param project
     */
    insertDefaultContextSet: function(project)    {
        let defaultContexts = [{
                "color": "#00cc00",
                "name": "LOCAL"
            }, {
                "color": "#dfdf00",
                "name": "DEV"
            }, {
                "color": "#ff8000",
                "name": "STAGE"
            }, {
                "color": "#df0000",
                "name": "LIVE"
            }];
        $.each( defaultContexts, ( i, context ) => {
            ExtOptions.insertContextItem( project, context );
        });
    },


    /**
     * Delete project
     * @param project element
     */
    deleteProjectItem: function(project)   {
        let uuid = $(project).attr( "id" ).replace(/^project_+/g, '');
        $( project ).remove();
        chrome.storage.sync.remove( 'project_' + uuid );
        // as long this removing works this way, I mean individual remove() and no global save options, textarea is not refreshing after deleting. so we have to do this manually
        ExtOptions.fillExportData();
    },
    
    
    /**
     * Delete all projects
     */
    deleteAllProjectItems: function()  {
        chrome.storage.sync.get( null, (allOptions) => {
            // find every option which is a project
            $.each(allOptions, (key, value) => {
                if (key.match(/^project_/g)) {
                    chrome.storage.sync.remove( key );    
                }
            });
        });
    },

    /**
     * Delete context
     * @param context element
     * @param project parent element
     */
    deleteContextItem: function(context, project)   {
        $( context ).remove();
        // if none left, display Add default set button
        if ( project.find( '.contexts-container .contextItem' ).length === 0 )
            project.find( '.env_contextAddDefaultSet' ).css( 'display', 'inline-block' );
    },

    /**
     * Delete link
     * @param link element
     * @param project parent element
     */
    deleteLinkItem: function(link, project)   {
        $( link ).remove();
    },

    /**
     * After sorting / dropping element 
     */
    sortDropCallback: function()   {
       ExtOptions.fillExportData();
    },


    expandAllProjects: function()  {
        $( '.projects-container .projectItem' ).removeClass('collapse');
    },
    
    collapseAllProjects: function()  {
        $( '.projects-container .projectItem' ).addClass('collapse');
    },


    // ENV SETTINGS: READ / WRITE

    /**
     * Get projects as object of objects. Used only for storage save.
     * Iterate projects / environments and collect data elements.
     * @return object
     */
    collectProjects: function() {
        let projects = {},
            i = 0;
        $( '.projects-container .projectItem' ).each( (i, el) => {
            let project = ExtOptions.readProjectData( $(el) );
            project.sorting = i++;
            projects[ 'project_' + project.uuid ] = project;
        });
        //console.info('collectProjects - projects: ', projects);
        return projects;
    },

     /**
     * Get projects as an array (most cases)
     * @return array 
     */
    getProjectsArray: function() {
        return Object.values( ExtOptions.collectProjects() );
    },

    /**
     * Extract project settings from html representation
     * @param project html object
     * @returns array
     */
    readProjectData: function(project)   {
        let projectItem = {};
        projectItem['name'] = project.find( "[name='project[name]']" ).val();

        projectItem['uuid'] = project.attr( "id" ).toString().replace(/^project_+/g, '')
            || makeRandomUuid(6);

        projectItem['contexts'] = [];
        projectItem['links'] = [];
        projectItem['hidden'] = project.find( "[name='project[hidden]']" ).is( ':checked' );
        projectItem['tstamp'] = project.data('tstamp') ?? 0;

        project.find( '.contexts-container .contextItem' ).each( (i, el) => {
            let context = $(el),
                contextItem = {};
            contextItem['name'] = context.find( "[name='context[name]']" ).val();
            contextItem['url'] = context.find( "[name='context[url]']" ).val();
            contextItem['color'] = context.find( "[name='context[color]']" ).val();
            contextItem['hidden'] = context.find( "[name='context[hidden]']" ).is( ':checked' );

            projectItem['contexts'].push( contextItem );
        });

        project.find( '.links-container .linkItem' ).each( (i, el) => {
            let link = $(el),
                linkItem = {};
            linkItem['name'] = link.find( "[name='link[name]']" ).val();
            linkItem['url'] = link.find( "[name='link[url]']" ).val();
            linkItem['hidden'] = link.find( "[name='link[hidden]']" ).is( ':checked' );

            projectItem['links'].push( linkItem );
        });

        return projectItem;
    },


    /**
     *
     * @param projects array
     * @param markAsNew bool
     */
    populateEnvSettings : function(projects, markAsNew)   {
        //if ( ExtOptions.DEV )
        //    console.info('projects from conf:', projects);

        if ( !Array.isArray( projects ) )
            projects = [];
        
        // put them in right order
        projects.sort(function(a, b){
            if (a.sorting > b.sorting)  return 1;
            if (a.sorting < b.sorting)  return -1;
            return 0;
        });
        

        $.each( projects, (i, projectItem) => {

            // no need to show or export sorting param anywhere. so cleanup before inserting
            delete(projectItem.sorting);

            ExtOptions.insertProjectItem( projectItem, markAsNew ? 'new' : '' );

            //if ( ExtOptions.DEV )
                //console.log(projectItem);
        });


        // when project list is ready, check configured there urls/hosts against permissions grant state 
        ExtOptions.checkHostsPermissions( projects );


        if ( !$( '#env_projects_autosorting' ).is( ':checked' ) ) {
            // init drag & drop
            $( '.projects-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer', update: () => { ExtOptions.sortDropCallback(); } });
        }
    },


    /**
     * Show Manifest 3 update info
     */
    manifestUpdateInfo : function( ) {

        // display modal infobox about needed actions 
        if ( !ExtOptions.options.info_manifest3_acknowledged )  {
            let content = $( '<h3>' ).html( 'MANIFEST version 3 issues')

                    //.add( $( '<h3>' ).html( '' ))
                    .add( $( '<p>' ).html( 'I\'m sorry to bother you, just a quick info: '
                        + '<br>Chrome Web Store ended support for addons based on Manifest v2 API, and soon the browser '
                        + 'will end possibility to run custom/local loaded v2 adds. That forced me to try to migrate too. '
                        + '' ))

                    .add( $( '<p>' ).html( 'The process was hard and tricky, for number of reasons: - the new API is completely different '
                        + 'and more limited, - that extension as a whole is a collection of tricks, compromises, improvisation and magic, which together made '
                        + 'that all possible, - I don\'t write much JS on everyday basis, even more I don\'t write browser addons, but this one. '
                        + '- and I have time for that once a few months, usually I don\'t really remember much how that thing works...'
                        + '' ))

                    .add( $( '<p>' ).html( 'So - the v3 Manifest migration was a huge struggle, and result is not perfect - <b>sometimes it doesn\'t load new data, doesn\'t '  
                        + 'refresh the context menu, sometimes it just forgets to do anything. I couldn\'t find a solution for that</b>, how the new API works in background. '
                        + 'It should be tested, fixed and released when stable - unfortunately, I must publish it now in current state. '
                        + '- <i>It\'s still a great everyday helper, which I can\'t imagine working without anymore.</i> '
                        + '' ))

                    .add( $( '<p>' ).html( 'I hope it will work for you most of the time. And if you\'re familiar with browser addons, Manifest 3 topic etc. - please maybe '
                        + 'take a look one day...'
                        + '' ))

                    .add( $( '<br>' ))
                    .add( $( '<h3>' ).html( 'The GOOD NEWS:'))
                    .add( $( '<p>' ).html( 'FINALLY! Backend Page Preselection works! ' ))
                    .add( $( '<p>' ).html( 'See details in next popup message -> ' ))
                    .add( $( '<br>' ))

                    .add( $( '<button class="btn confirm-warn confirm-acknowledged"> <span class="text">OK / Fine / Great</span> </button>' ))
                ;

            let dialog = ExtOptions.openDialog('IMPORTANT: Chrome ext API change', content, 'text-left');

            dialog.find('.confirm-acknowledged').click( () => {
                chrome.storage.sync.set({'info_manifest3_acknowledged': true});
                ExtOptions.options.info_manifest3_acknowledged = true;
                ExtOptions.closeDialog( dialog );
            });
            dialog.find('.confirm-close').click( () => {
                ExtOptions.closeDialog( dialog );
            });
        }
    },


    /**
     * Show Backend Preselection info
     */
    backendPreselectionInfo : function( ) {

        // display modal infobox
        if ( !ExtOptions.options.info_be_preselection_acknowledged )  {
            let content = $( '<h3>' ).html( 'Backend Page preselection!')

                    .add( $( '<p>' ).html( 'That means: when you are in Frontend and switch to Backend, it will try to get '
                        + 'the page uid, to expand the Page Tree and directly display Page edit view - no need to search through the tree '
                        + 'every time, what subpage that could be.'
                        + '' ))

                    .add( $( '<p>' ).html( '<i>(- I tried to achieve that long time ago, experimenting with injecting javascript to expand the tree '
                        + ' somehow, but with no success... <br> '
                        + ' Since TYPO v11 (or 12?) it\'s simple - deep linking in backend allows to just open any record with prepared url.)</i> ' 
                        + '' ))

                    .add( $( '<h3>' ).html( 'How that knows the page uid? What is needed?'))

                    .add( $( '<p>' ).html( ' The idea is simple - the page uid must be included somewhere in frontend html. '
                        + ' Then it\'s retrieved from the source when the Backend button is clicked. '
                        + '' ))

                    .add( $( '<p>' ).html( ' Most projects I\'ve seen or built has already some body or html classes or ids. '
                        + ' It can be in: <b>html</b> or <b>body</b> tag, class or id attrib, containing a string which looks '
                        + ' like: "pid-N", "page_N" or similar combinations - small javascript is injected to page source and it '
                        + ' tries to find it before opening Backend tab. '
                        + ' <br>If you prefer/get used to some other naming convention for page uid in your markup, let me know, I\'ll include yours in patterns. '
                        + '' ))

                    .add( $( '<p>' ).html( ' (For details you can take a look into source, to the <a href="https://github.com/w010/chrome-typo3-switcher/blob/master/EXT%20pub/frontend_getData.js">frontend_getData.js</a>'
                        + ' file to see what it does exactly.) '
                        + '' ))

                    .add( $( '<br>' ))

                    .add( $( '<button class="btn confirm-warn confirm-acknowledged"> <span class="text">Great!</span> </button>' ))
                ;

            let dialog = ExtOptions.openDialog('NEW FEATURE:', content, 'text-left');

            dialog.find('.confirm-acknowledged').click( () => {
                chrome.storage.sync.set({'info_be_preselection_acknowledged': true});
                ExtOptions.options.info_be_preselection_acknowledged = true;
                ExtOptions.closeDialog( dialog );
            });
            dialog.find('.confirm-close').click( () => {
                ExtOptions.closeDialog( dialog );
            });
        }
    },

    
    /**
     * Show permissions info to new user
     */
    permissionsInfo : function( ) {

        // For new users:
        // Ext won't work until the permissions are granted. We need to inform the user and let him allow all or close and decide each host.


        // display modal infobox about needed actions 
        if ( !ExtOptions.options.internal_permissions_acknowledged )  {
            let content = $( '<h3>' ).html( 'Because of browser\'s security policy, our extension must ask you for a host permission.')

                    .add( $( '<h3>' ).html( '- Why does it need such a permission?' ))
                    .add( $( '<p>' ).html( 'This is the essential of how this ext works - to inject color infobadge and modify favicon on your projects, it needs to be able to'
                        + 'read / write to tab\'s DOM (html) content. If you don\'t trust what the ext do, please just uninstall (or analyse the source).' ))

                    .add( $( '<h3>' ).html( '- You may:' ))
                    .add( $( '<p>' ).html( 'a) - Allow now <b>access to all</b> hosts, to not be bothered, using the red button below.' ))
                    .add( $( '<p>' ).html( 'b) - Decide about <b>each domain</b> - browser will ask every time you add your projects.' ))
                    .add( $( '<p>' ).html( 'or c) - Close and Decide / edit <b>later</b> (you can use an option to request all again)' ))
                    .add( $( '<br>' ))
                    
                    .add( $( '<button class="btn confirm-warn request-permissions-all-hosts"> <span class="text">OK - ALLOW ALL</span> </button> <span>...request permission to ALL hosts and don\'t ask again (make sure you know what it means)</span>' ))
                    .add( $( '<br><br>' ))
                    .add( $( '<button class="btn confirm-close"> <span class="text">Close - I want to be asked</span> </button> <span>...to decide each domain is allowed.</span>' ))
                ;

            let dialog = ExtOptions.openDialog('Handy Switcher - permissions', content, 'text-left');

            dialog.find('.dialog-close').remove();  // remove X button - force to make a choose from buttons
            ExtOptions.dialogsOpenStack = [];  // prevent dismiss modal using esc key

            dialog.find('.confirm-close').click( function() {
                chrome.storage.sync.set({'internal_permissions_acknowledged': true});
                ExtOptions.options.internal_permissions_acknowledged = true;
                ExtOptions.closeDialog( dialog );
                
            });
            dialog.find('.request-permissions-all-hosts').click( function() {
                chrome.storage.sync.set({'internal_permissions_acknowledged': true});
                ExtOptions.options.internal_permissions_acknowledged = true;
                ExtOptions.closeDialog( dialog );
                ExtOptions.requestHostPermission( '*://*/*' );
               // $('.projects-container .unpermitted').removeClass('unpermitted');
            });
        }


        // permissions info

        chrome.permissions.getAll( (permissions) => {
            // display permissions list
            let containerPermittedOrigins = $('.container-permitted-origins');
            let originsContent = ''; 
            $.each( permissions.origins, (o, origin) => {
                originsContent += '<li>' + origin + '</li>';
            });
            containerPermittedOrigins.html( '<ul>' + originsContent + '</ul>' );
        });

            /*
            // mark projects / url with unpermitted host/domain
            // reset
            //$('.projects-container .unpermitted').removeClass('unpermitted');

            let checkUrlIsPermitted = function( url, callback ) {
                let formattedHostUrl = ExtOptions.controlUrlHostFormat( url );

                chrome.permissions.contains({   
                        permissions: ['tabs'],
                        origins: [ formattedHostUrl ]
                    }, function( hostPermitted ) {

                        callback( hostPermitted );
                });
            };

            // iterate all projects on list
            $('.projects-container .projectItem').each( function(p, project){
                let $project = $(project);
                if ($project.hasClass('hidden'))
                    return;

                $project.find( '.item input.url' ).each( function(i, itemInput){
                    let $itemInput = $(itemInput);
                    if ( $itemInput.val() ) { 
                        checkUrlIsPermitted( $itemInput.val(), function( permitted ){
                            // in check callback mark context as unpermitted
                            if ( !permitted )   {
                                $itemInput.closest('.item').addClass('unpermitted')
                                    .attr('title', 'Host not permitted! Save and allow access to this domain when asked');
                            }
                            // check Project, if contains any 'unpermitted' items 
                            if ( $project.find('.unpermitted').length ) {
                                $project.addClass('unpermitted');
                            }
                        });
                    }
                });
            });
        });*/
    },

    /**
     * Make a check of permissions state (and migration notification about them)
     * 
     * @param projects
     */
    checkHostsPermissions : function( projects ) {
        console.log('CHECK PERMISSIONS START');
        
        // When the ext was just updated to a version with the new host-permissions, it won't work until the permissions are granted.
        // We need to inform the user about that situation and let him go to the options and trigger save, that will start the procedure of granting access to each of his hosts.
        // So we show an additional position in ext menus (everyone should notice that info there) which opens options screen.
        // There we display some more clear info what to do. (modal)
        //  (We show the info in menus and modal only for current users after update, who have any stored project/s - for which we'd need to ask about that permission.
        //  Don't show this to new users, if no projects exist, or if ..._acknowledged = true)



        // display modal infobox about needed actions 
        if ( !ExtOptions.options.internal_permissions_acknowledged  &&  typeof projects !== 'undefined'  &&  projects.length )  {
            let content = $( '<h3>' ).html( 'Due to the new, straightforward downgraded permission config, instead of previous global access to all hosts - we now use explicit optional host permission for each domain.')
                    .add( $( '<h3>' ).html( 'The global Host Permission declaration is now removed, so it must be confirmed again that Handy Switcher still has access to the hosts from your stored Projects.' ))

                    .add( $( '<br>' ))
                    .add( $( '<h3>' ).html( '- Details?' ))
                    .add( $( '<p>' ).html( 'The main reason of that change is the additional in-depth Chrome Store\'s review of ext source, of all extensions which uses the Host permission. '
                        + 'That seems to take a ridiculous amounts of time to wait for each ext update to be finally published (weeks). So, to avoid that, '
                        + 'and any current (+ possibly future) problems with Chrome\'s security policy, now you will be asked for a permission when adding Context/Link url with a new domain (unless you allow all).' ))

                    .add( $( '<br>' ))
                    .add( $( '<h3>' ).html( '- What must I do? Is it really necessary? I have work to do / dog to go for a walk' ))
                    .add( $( '<p>' ).html( 'For the same reason, to continue using Switcher like before with your existing Projects, it needs you to confirm that permission for all / the domains found in your stored Projects, to make the Switcher be able '
                        + 'to access these sites and work like before. Not granting a host makes the Badge and Favicon not show on that domain. (can\'t access tab\'s DOM/html to inject these elements to source, + other limitations)' ))

                    .add( $( '<br>' ))
                    .add( $( '<h3>' ).html( '- OK, how?' ))
                    .add( $( '<p>' ).html( 'a) Close this dialog and call Save in Options screen. The browser will do all that asking by itself. After confirming all your hosts, it will be working again. (you can later review or reject these decisions)' ))
                    .add( $( '<p>' ).html( 'or b) Request allow all using the red button here:' ))
                    .add( $( '<br>' ))

                    .add( $( '<button class="btn confirm-warn request-permissions-all-hosts"> <span class="text">OK - ALLOW NOW ALL</span> </button> <span>...request permission to ALL hosts and don\'t ask again (make sure you know what it means)</span>' ))
                    .add( $( '<br><br>' ))
                    .add( $( '<button class="btn confirm-close"> <span class="text">Acknowledged. I\'ll save LATER</span> </button> <span>...to decide each domain is allowed. (note - it will ask many times, if you have many projects)</span>' ))
                ;

            let dialog = ExtOptions.openDialog('Handy Switcher was updated recently - permissions must be reconfirmed', content, 'text-left');

            dialog.find('.dialog-close').remove();  // remove X button - force to make a choose from buttons
            ExtOptions.dialogsOpenStack = [];  // prevent dismiss modal using esc key

            dialog.find('.confirm-close').click( function() {
                chrome.storage.sync.set({'internal_permissions_acknowledged': true});
                ExtOptions.options.internal_permissions_acknowledged = true;
                ExtOptions.closeDialog( dialog );
            });
            dialog.find('.request-permissions-all-hosts').click( function() {
                chrome.storage.sync.set({'internal_permissions_acknowledged': true});
                ExtOptions.options.internal_permissions_acknowledged = true;
                ExtOptions.closeDialog( dialog );
                ExtOptions.requestHostPermission( '*://*/*' );
               // $('.projects-container .unpermitted').removeClass('unpermitted');
            });
        }


        return;

        // permissions info

        /*chrome.permissions.getAll( function( permissions )  {
            // display permissions list
            let containerPermittedOrigins = $('.container-permitted-origins');
            let originsContent = ''; 
            $.each( permissions.origins, function (o, origin)  {
                originsContent += '<li>' + origin + '</li>';
            });
            containerPermittedOrigins.html( '<ul>' + originsContent + '</ul>' );




            // mark projects / url with unpermitted host/domain
            
            // reset
            //$('.projects-container .unpermitted').removeClass('unpermitted');


            let checkUrlIsPermitted = function( url, callback ) {
                let formattedHostUrl = ExtOptions.controlUrlHostFormat( url );

                chrome.permissions.contains({   
                        permissions: ['tabs'],
                        origins: [ formattedHostUrl ]
                    }, function( hostPermitted ) {

                        callback( hostPermitted );
                });
            };



            // iterate all projects on list
            $('.projects-container .projectItem').each( function(p, project){
                let $project = $(project);
                if ($project.hasClass('hidden'))
                    return;


                $project.find( '.item input.url' ).each( function(i, itemInput){
                    let $itemInput = $(itemInput);
                    if ( $itemInput.val() ) { 

                        checkUrlIsPermitted( $itemInput.val(), function( permitted ){

                            // in check callback mark context as unpermitted
                            if ( !permitted )   {
                                $itemInput.closest('.item').addClass('unpermitted')
                                    .attr('title', 'Host not permitted! Save and allow access to this domain when asked');
                            }

                            // check Project, if contains any 'unpermitted' items 
                            if ( $project.find('.unpermitted').length ) {
                                $project.addClass('unpermitted');
                            }
                        });
                    }
                });
            });
        });*/
    },


    /**
     * Request permissions for every single domain added in config (at least in not hidden items - or maybe it should take all?)
     *
     * @param projects
     */
    requestPermissions : function( projects )  {
        
        // requesting every each host, marking permissions and all this handling seems to be way overcomplicated. try to request wildcard and maybe that's enough
        
        // dismiss any previous permission error message
        $('.status-permissions').html('').removeClass('show');


        /* comment out this lopp in case of problems with individual requests and uncomment wildcard */
        $.each( projects, function(projectId, project)    {

            if ( !project.hidden )    {
                // merge links + contexts to do all in one iteration 
                let contextsAndLinks = project.contexts.concat( project.links );
                
                $.each( contextsAndLinks, function(c, item)    {
                    if ( !item.hidden  &&  item.url )    {
                        let formattedHostUrl = ExtOptions.controlUrlHostFormat( item.url );
                        
                        console.log('- Check for host permission: ' + formattedHostUrl);

        //let formattedHostUrl = '*://*/*';


        /* end */
                        // check permission and request if false

                        chrome.permissions.contains({   
                            permissions: ['tabs'],
                            origins: [ formattedHostUrl ]
                        }, function( hostPermitted ) {
                            if ( !hostPermitted ) {
                                console.log('-- Not permitted');

                                ExtOptions.requestHostPermission( formattedHostUrl, item );
                            }
                            
                            ExtOptions.checkHostsPermissions( [] );
                        });
        /* */
                    }
                });
            }
        });
        /* */
    },
    
    requestHostPermission : function( formattedHostUrl, item )  {
        if (typeof item === 'undefined')
            item = {url: ''};

        console.log('-- Not permitted. Request for host permission: ' + formattedHostUrl);

        // "Permissions must be requested from inside a user gesture, like a button's click handler."
        chrome.permissions.request({
            origins: [ formattedHostUrl ]
        }, function( granted ) {

            if ( chrome.runtime.lastError )    {
                console.error(' -- permission.request last error: ' + chrome.runtime.lastError.message);
                ExtOptions.displayMessage( 'Permission request problem - usually means bad url. Check your config. Returned message:<br>'
                        + '<b>' + chrome.runtime.lastError.message + '</b><br><br>'
                        + ' -- requested url/host: <b>' + formattedHostUrl + '</b><br>'
                        + ( item.url ? ' -- original url value: <b>' + item.url + '</b>' : '')
                    , 'error', '.status-permissions', 30000 );
                $('html,body').animate({scrollTop: $(".status-permissions").offset().top - 250}, 300);
            }

            if ( granted )  {
                console.info(' - GRANTED permission for host: ' + formattedHostUrl);
            }
            else    {
                console.info(' - Permission DECLINED for host: ' + formattedHostUrl);
            }
        });
    },
    
    /**
     * Make sure the url string has valid format expected by permissions.request      https://developer.chrome.com/docs/extensions/mv3/match_patterns/
     * - check if url has a schema or add one, append the path wildcard (/*) (if no trailing slash and only domain without path is given. otherwise keep as is)
     * @param value
     * @return string
     */
    controlUrlHostFormat : function( value )    {
        let url = '' + value.toString();
        // if url in project is only a domain without scheme, request permission for all
        if ( !url.startsWith('http') )    {
            url = '*://' + url;
        }
        else    {
            url = url.replace(/https?:\/\//, '*://');
        }

        // extract domain, ask for permission to a host + wildcard
        let urlParts = url.split(/\//);
        url = urlParts[0] + '//' + urlParts[2] + '/*';

        return url;
    },
    

    /**
     * Find and mark duplicate uuid projects, mark freshly imported etc.
     */
    checkItems : function()  {

        $('.projectItem').removeClass( 'uuid-collision' )
            .find( '.info.collision' ).remove();

        $('.projectItem:not(._template)').each(function(i, project)    {
            let lookupItem = $( '[id="' + project.id + '"]' );

            if ( lookupItem.length > 1 )  {
                lookupItem.each( function (c, duplicate) {
                    let $duplicate = $(duplicate);

                    if ( $duplicate.hasClass('uuid-collision') )
                        return;

                    $duplicate.addClass('uuid-collision');

                    $duplicate.prepend(
                        $( '<div>' ).addClass( 'info collision' )
                            .html('<b>Unique id collision!</b> Please review. Uuid = <b>' + project.id.replace(/^project_+/g, '') + '</b> - Only the last project with duplicated uuid will be stored!</div>' )
                    );
                });
            }
        });


        let collidedProjects = $( '.projectItem.uuid-collision' ); 
        let newProjects = $( '.projectItem.new' );

        // jump to first collision item, if any 
        if ( collidedProjects.length )    {
            $('html,body').animate({scrollTop: collidedProjects.offset().top - 100}, 300);
        }
        // jump to first imported
        else if ( newProjects.length )    {
            $('html,body').animate({scrollTop: newProjects.offset().top - 100}, 300);
        }
    },


    // IMPORT / EXPORT


    /**
     * Put json with projects into textarea
     * @param projects array 
     */
    fillExportData : function ( projects ) {
        if ( !Array.isArray( projects ) )
            projects = [];

        // in most cases we don't pass here anything, just get all projects here
        if ( !projects.length )
            projects = ExtOptions.getProjectsArray();

        // don't put lonely brackets into textarea, when array is empty 
        let exportData = projects.length ? JSON.stringify( projects, null, 4 ) : null;

        $( '#env_importexport-data' ).html(
            exportData
        ).focus( function() {
            this.select();
        });
    },


    importProjects : function ( dataString )    {
        var importData = [];
        try {

            if ( $( "select#env_import_extension" ).val() )   {
                importData = ExtOptions.importProjectsFromOtherExtension_mapItems( dataString );
            }
            else    {
                importData = JSON.parse( dataString );
            }

            if ( $( '#env_import_overwrite' ).is( ':checked' ) )  {
                $( '.projects-container' ).empty();
                ExtOptions.deleteAllProjectItems();
            }
            
            // allow importing single project as object (without []) - don't throw error and just make it an array here  
            if (!$.isArray(importData))  {
                importData = [importData];
            }

            ExtOptions.populateEnvSettings( importData, true );


            if ( !$( '#env_import_test' ).is( ':checked' ) ) {
                ExtOptions.optionsSave();
                ExtOptions.displayMessage( 'Environments / projects imported', 'success', '.status-import', -1 );
            }
            else    {
               ExtOptions.displayMessage( 'Environments / projects imported - TEST IMPORT - not autosaved', 'warn', '.status-import', -1 );
            }

        } catch(e)   {
            if ( ExtOptions.DEV )
                console.log(e);
            ExtOptions.displayMessage( 'JSON parsing problem. Message: <br>' + e.message, 'error', '.status-import', -1 );
        }

        if ( ExtOptions.DEV )
            console.log( importData );
    },


    importProjectsFromTextarea : function ()    {
        ExtOptions.importProjects( $( '#env_importexport-data' ).val() );
    },


    importProjectsFromUpload : function (files)  {
        var file = files[0];

        if ( !file || !window.FileReader )  {
            ExtOptions.displayMessage( 'File reader problem', 'error', '.status-import', -1 );
            return;
        }

        var reader = new FileReader();
        reader.readAsText( file );
        reader.onloadend = function()   {
            ExtOptions.importProjects( reader.result );
        }
    },

    importProjectsFromOtherExtension_mapItems : function (dataString)    {
        var extension = $( "select#env_import_extension" ).val();
        var importData = [];
        var projects;

        switch ( extension )    {

            case 'environment_switcher':
                projects = JSON.parse( dataString );
                $.each( projects, function( i, project ) {
                    if ( !project.name )
                        return true;    // continue in $.each
                    var contexts = [];
                    var links = [];

                    if ( $.isArray( project.environments ) )    {
                        $.each( project.environments, function( i, environment ) {
                            if ( typeof environment !== 'undefined'  &&  environment !== null )
                                contexts.push({
                                    name: environment.name,
                                    url: environment.baseUrl,
                                    hidden: !environment.status
                                });
                        });
                    }
                    if ( $.isArray( project.links ) )    {
                        $.each( project.links, function( i, link ) {
                            links.push({
                                name: link.text,
                                url: link.url,
                                hidden: !link.status
                            });
                        });
                    }
                    importData.push({
                        name : project.name,
                        contexts : contexts,
                        links : links
                    });
                });
                break;

            case 'environment_switcher2':

                // base64 decode
                dataString = decodeURIComponent(window.atob(dataString));
                projects = JSON.parse( dataString );

                if ( typeof projects.Sites !== 'undefined' )    {
                    $.each( projects.Sites, function( i, project ) {
                        if ( !project.Name )
                            return true;    // continue in $.each
                        var contexts = [];

                        if ( $.isArray( project.Environments ) )
                            $.each( project.Environments, function( i, environment ) {
                                if ( typeof environment !== 'undefined'  &&  environment !== null )
                                    contexts.push({
                                        name: environment.Name,
                                        url: environment.Domain,
                                        color: environment.Color
                                    });
                            });
                        importData.push({
                            name : project.Name,
                            contexts : contexts
                        });
                    });
                }
                break;

            case 'environment_marker':
                projects = JSON.parse( dataString );
                $.each( projects, function( i, project ) {
                    if ( !project.name )
                        return true;    // continue in $.each
                    var contexts = [{
                        name: project.name,
                        url: project.address,
                        color: '#' + project.color
                    }];

                    importData.push({
                        name : project.name,
                        contexts : contexts
                    });
                });
                break;
                
            case 'domain_visualizer':
                projects = JSON.parse( dataString );
                $.each( projects, function( url, project ) {
                    if ( !url )
                        return true;    // continue in $.each
                    var contexts = [{
                        name: project.name,
                        url: url,
                        color: project.backgroundColor
                    }];

                    importData.push({
                        name : project.name,
                        contexts : contexts
                    });
                });
                break;
        }

        return importData;
    },


    exportProjectsDownloadFile : function( project ) {
        //var data = new Blob( [ JSON.stringify( ExtOptions.options.env_projects, null, 4 ) ], {type: 'text/json'} );
        //var url = window.URL.createObjectURL( data );
        var exportData;
        var filename;

        if ( project )  {
            var projectItem = ExtOptions.readProjectData( project );
            exportData = JSON.stringify( projectItem, null, 4 ) + '\n';
            filename = 't3switcher-project--'+projectItem.name+'.json';
        }
        else    {
            exportData = $( '#env_importexport-data' ).val();
            filename = 't3switcher-projects.json';
        }

        var url = 'data:text/plain;charset=utf-8,' + encodeURIComponent( exportData );
        //console.log(url);
        var a = document.createElement( "a" );
        document.body.appendChild( a );
        a.style = "display: none";
        a.href = url;
        a.download = filename;
        a.click();
        a.remove();
        //window.URL.revokeObjectURL( url );
    },



    // HELPERS



    /**
     * Display a notice
     * @param msg string
     * @param errorLevel string - info, success, warn, error
     * @param target string - element selector
     * @param time integer - displaying time of the message
     */
    displayMessage : function(msg, errorLevel, target, time)   {
        if ( typeof time !== 'number' )   time = 4000;
        if ( typeof target !== 'string' )  target = '.status-notice';
        if ( typeof errorLevel !== 'string' )  errorLevel = 'info';

        var status = $( target );
        status.removeClass( 'level-info level-success level-warn level-error' );
        status.addClass( 'level-'+errorLevel );
        status.html( msg );
        status.addClass( 'show' );
        if (time >= 0)
            setTimeout( function() {
                status.html('');
                status.removeClass( 'show' );
            }, time);
    },


    /**
     * Simple modal dialog with Yes / No buttons
     * @param title string
     * @param message string
     * @param callbackConfirm function
     * @param callbackDecline function
     */
    confirmDialog : function(title, message, callbackConfirm, callbackDecline)   {
        if ( typeof callbackConfirm !== 'function' )  callbackConfirm = function(){};
        if ( typeof callbackDecline !== 'function' )  callbackDecline = function(){};

        // bind buttons after creating dialog - we need to have dialog instance to pass to callback
        let content = $( '<h3>' ).html( message )
            .add( $( '<button class="btn remove confirm-warn">' ).html( '<span class="icon"></span> <span class="text">YES</span>' ) )
            .add( $( '<button class="btn decline">' ).html( '<span class="text">No, keep it</span>' ) );

        let dialog = ExtOptions.openDialog(title, content);

        dialog.find('.confirm-warn').click( function() {
            callbackConfirm();
            ExtOptions.closeDialog( dialog );
        });

        dialog.find('.decline').click( function() {
            callbackDecline();
            ExtOptions.closeDialog( dialog );
        });

        return dialog;
    },
    


    /**
     * Open simple modal dialog
     * @param title string
     * @param content string
     * @param classname
     * @param callback function
     */
    openDialog : function(title, content, classname, callback)   {
        let id = Math.floor(Math.random() * 1024);
        let dialog_overlay;
        if ( !classname )
            classname = '';

        if ( $( '#dialog-group > .dialog' ).length === 0 )
            dialog_overlay = $( '<div class="dialog-overlay">' );
        let dialog = $( '<div class="dialog  '+ classname +'  dialog-loading" id="dialog_'+id+'">' )
            .css('display', 'none')
            .append(
                $( '<div class="dialog-inner">' )
                    .append( $( '<h2 class="dialog-head">' ).html( title ) )
                    .append( $( '<span class="dialog-close" title="Close">' ).html( 'X' ).on('click', function(){ ExtOptions.closeDialog( dialog ); }) )
                    .append( $( '<div class="dialog-body">' ).html( content ) )
        );
        let $dialog_group = $( '#dialog-group' );
        $( dialog_overlay )
            .insertBefore( $dialog_group );
        $dialog_group
            .append( dialog );

        // must unhide right before removing load class to make transition work. create as hidden
        dialog.show().removeClass('dialog-loading');

        if (callback instanceof Function) {
            callback( dialog );
        }
        // stack open dialogs
        ExtOptions.dialogsOpenStack.push( dialog );
        
        return dialog;
    },

    /**
     * Close dialog / remove modal object
     */
    closeDialog : function(dialog)  {
        dialog?.remove();
        ExtOptions.dialogsOpenStack.pop();

        // sometimes there's more dialogs at once (ie. confirmation popup but called in modal) so remove overlay when there's no more left
        if ( $( '#dialog-group > .dialog' ).length === 0 )
            $( 'body > .dialog-overlay' ).remove();
    },

    /**
     * Add loader image into ajax container
     * @param element object
     */
    ajaxAddLoaderImage : function(element)    {
        if ( !element.find('.ajaxloader').length )
        element.append(
            $('<span class="ajaxloader ajaxloader-size-default ajaxloader-state-default ajaxloader-spin"><span class="ajaxloader-markup"><img src="Images/ajax-loader.svg">')
        );
    },

    /**
     * Set some additional non-critical (visual) elements
     */
    initVisualDetails : function()    {
        // set extension version number
        $('.ext-version').html( /*'v ' +*/ chrome.runtime.getManifest().version );
    },

    /**
     * Show storage usage
     */
    updateStorageInfo : function()    {
        //if ( !ExtOptions.DEV )    return;
        chrome.storage.sync.getBytesInUse(null, function (bytes) {
            $( '#storageInfo' ).html(
                '<h4> Storage info: </h4>' +
                '<p> Bytes in storage: ' + bytes + '</p>');
        });
    },

    /**
     * Debug environment data to be saved
     */
    debugSaveEnv : function() {
        if ( !ExtOptions.DEV )    return;
        console.log('called: ExtOptions.debugSaveEnv');
        let envSettings = ExtOptions.getProjectsArray();
        $( '#debug' ).html( JSON.stringify( envSettings, null, 4 ).replaceAll(/(["{}\[\],])/gm, ' ').replaceAll(/( :)/gm, ':') );
    },

    /**
     * Debug whole storage saved data
     */
    debugStorageData : function() {
        if ( !ExtOptions.DEV )  return;
        chrome.storage.sync.get( null, function(options) {
            $( '#debugExtInfo' ).html(
                '<h4> Extension info: </h4>' +
                '<p> Version: ' + chrome.runtime.getManifest().version + '<br>' +
                'Id: ' + chrome.runtime.id + '</p><br>'
            );
            $( '#debugStorageContent' ).html(
                '<p> Storage contents: <br>' +
                '<i>(you may want to refresh the page to be 100% sure this content is up-to-date)</i></a><br>' + 
                '<a href="#" class="expand"> [ EXPAND ] </a><br>' +
                '<pre class="section-foldable">' + (JSON.stringify( options, null, 4 )
                    ).replaceAll(/(["{}\[\],])/gm, ' ').replaceAll(/( :)/gm, ':') + '</pre>'
            )
                .find('a.expand').on('click', function (e){
                    // console.log( $(this).parent().parent() );    
                    // console.log( $(this).parent().parent().find('.section-foldable') );    
                    $(this).parent().parent().find('.section-foldable').addClass('expand');    
                    e.preventDefault();
            });
        });
    },

    /**
     * link range inputs with their text fields
     */
    linkRangeInputs : function()    {
        $( 'input[type=range]' ).each( (i, el) => {
            // take range input and find its text input by id
            let range = $(el),
                text = $( '#' + range.prop('id').replace('__range', '') );
            text.on( 'keyup', () => {
                // prevent typing beyond range's scope
                let value = Math.min(Math.max(text.val(), range.prop('min')), range.prop('max'));
                text.val( value );
                range.val( value );
            });
            range.on( 'input', function(){
                text.val( range.val() );
            });
        });
    },

    /**
     * Favicon preview - replace src of image with fresh generated using current configuration
     */
    setFaviconPreview: function()  {

        Favicon.DEV = ExtOptions.DEV;

        let faviconUrl = 'Icons/favicon-options-test.svg';
        let newFaviconSrc = '';
        let params = {
            'contextColor' :    '#dd0000',     // preview using red. do we need this configurable?
            'alpha' :           $( '#env_favicon_alpha' ).val(),
            'fill' :            $( '#env_favicon_fill' ).val(),
            'position' :        $( '#env_favicon_position' ).val(),
            'composite' :       $( '#env_favicon_composite' ).val()
        };

        let originalIconImageObject = new Image();
        originalIconImageObject.src = faviconUrl;

        originalIconImageObject.onload = function() {

            let canvas = Favicon.renderFaviconWithOverlay( originalIconImageObject, params );
            newFaviconSrc = canvas.toDataURL();

            $('#favicon-preview').prop('src', newFaviconSrc)
                .prop('width', '20')
                .prop('height', '20')
                .on('click', function (){
                    $(this).prop('width', '64').prop('height', '64');
                });
        };
    },

    /**
     * Badge preview - show badge like on normal page to see how it looks
     */
    setBadgePreview: (enabled) => {

        if ( !enabled )  {
            $('.chrome-typo3switcher-badge').remove();
            return;
        }

        //console.log('refresh badge - remove before setting new one');
        //$('.chrome-typo3switcher-badge').remove();

        let badge_params = {
            'DEV':                  ExtOptions.DEV,
            'DEBUG':                ExtOptions.DEBUG,
            'projectLabel':         'Badge',
            'contextLabel':         'Preview',
            'contextColor':         '#ff8000',
            'projectLabelDisplay':  $( '#env_badge_projectname' ).prop('checked'),
            'scale':                parseFloat( $( '#env_badge_scale' ).val() ),
            'position':             $( 'input[name=badge_position]:checked' ).val(),
        };

        Badge.setBadge(badge_params);


                // failed try: can't exec js on options screen this way! because restrictions
                /*chrome.tabs.executeScript( null, {
                    code: 'let badge_params = {' +
                            .... */
    },

    /**
     * Make any use of favicon config controls auto refresh preview
     */
    bindFaviconControlsForPreview: function()  {
        $('.settings-block-section.__favicon input, .settings-block-section.__favicon select').each(function(){
            $(this).on('input', function(){
                //console.log('favicon settings changed');
                ExtOptions.setFaviconPreview();
            });
        });
    },

    /**
     * Make any use of badge config controls auto refresh badge
     */
    bindBadgeControlsForPreview: function()  {
        $('.settings-block-section.__badge input, .settings-block-section.__badge select').each(function(){
            $(this).on('input', function(){
                //console.log('badge settings changed');
                ExtOptions.setBadgePreview();
            });
        });
    },

    /**
     * Make editing any field autosave after use
     */
    bindAutosave: function () {
        
        $( '.settings-block' )
            
            // prepare text inputs to check state
            .on( 'change', 'input[type=text]:not(.no-autosave)', (e) => {
                // store this state in property - can't check this out-of-the-box  [it was for autosave on blur problem solve]
                $(this).data('hasChanged', true);
            })
            
            
            // try to autosave on project block loose focus
            .on( 'blur', '.projectItem', (e) => {
                // .on( 'focusout', '.projectItem', (e) => {
                
                console.log( e );
                console.log('currentTarget', e.currentTarget);
                console.log('target', e.target);
                
                console.log('target found in current target: ', $(e.currentTarget).find( $(e.target) ).length );
                console.log('target IS current target: ', e.currentTarget  ===   e.target  );
                
                
                // rozpisac rodzaje TARGETS w przypadku Project
                
                
                // rozpisac rodzaje CURRENTTARGETS w przypadku Project
                
                
                /*if (  $(e.currentTarget).find( $(e.target) ).length )   {
                    
                    console.log('BLUR PROJECT!');
                    
                }
                else    {
                    console.log(' click inside!');
                    
                }
*/

  /*              console.log('BLUR PROJECT!');

            }else    {
            console.log(' click inside!');

        }*/
        // if( !$(e.target).is('#foo') )
                // console.log( $.contains( $(e.target), $(e.currentTarget) ) );
                // console.log( $.contains( e.currentTarget, e.target ) );
                // console.log( $.contains( e.target, e.currentTarget ) );
                // console.log( $(e.target).contains( $(e.currentTarget) ) );

               /* if ( $.contains( e.currentTarget, e.target ))
{
                    console.log('BLUR PROJECT!');
    // console.log();
}
                else    {
                    console.log(' click inside!');
                    
                }*/
                
                // if (e.relatedTarget)
            })
            
            
            // text: on enter key pressed in text input
            .on( 'keypress', 'input[type=text]:not(.no-autosave)', (e) => {
                if ( e.which === 13 )       ExtOptions.optionsSave( e );
            })
            // text: on input loose focus 
            .on( 'blur', 'input[type=text]:not(.no-autosave)', (e) => {
                // delay needed to run other events first, - like handle button clicked when blurring. if still happens, try to increase time
                setTimeout(() => {
                    if ($(this).data('hasChanged')) {
                        ExtOptions.optionsSave( e );
                        $(this).data('hasChanged', false);
                        // refocus - because it now blurs input, if blurred by clicking on another input
                        //$(e).focus();
                    }
                }, 150);
            })
            // checkbox: click
            .on( 'click', 'input[type=checkbox]:not(.no-autosave)', (e) => {
                ExtOptions.optionsSave( e );
            })
            // radio: change
            .on( 'change', 'input[type=radio]:not(.no-autosave)', (e) => {
                ExtOptions.optionsSave( e );
            })
            // select: change
            .on( 'change', 'select:not(.no-autosave)', (e) => {
                ExtOptions.optionsSave( e );
            })
            // range: change
            .on( 'change', 'input[type=range]:not(.no-autosave)', (e) => {
                ExtOptions.optionsSave( e );
            })
            // color: change
            .on( 'change', 'input[type=color]:not(.no-autosave)', (e) => {
                ExtOptions.optionsSave( e );
            })
            ;
    },
    
    initFoldableSections: function ()  {
        $('.section-foldable').each(function( i, sectionNode )    {
            let section = $( sectionNode );
            let triggerSelector = section.data('visibility-trigger');

            if ( $(triggerSelector).is( ':checked' ) )    {
                section.addClass('expand');
                section.css('maxHeight', 'auto');
            }
    
            $( triggerSelector ).on('click', function ()    {
                if ( $(this).is( ':checked' ) ) {
                    section.css('maxHeight', 'auto');
                    section.addClass('expand');
                }
                else    {
                    section.removeClass('expand');
                }
            });
        });
    },
    
    flushStorageKey: function ( key )   {
        if ( !key )
            return ExtOptions.displayMessage( 'Not called - no key name given!', 'error', '.status-manipulate-storage', 10000 );
        if ( !ExtOptions.DEV )
            return ExtOptions.displayMessage( 'Not called - DEV mode must be enabled to execute this request', 'warn', '.status-manipulate-storage', 10000 );

        if ( key === '_ALL!')   {
            ExtOptions.confirmDialog( 'FLUSH _WHOLE_ STORAGE REQUESTED!', 'Are you sure, that you\'re sure?',() => {
                // sync.clear() might be used, but this way we can also log every removed item 
                chrome.storage.sync.get( null, function(options) {
                    $.each(options, (k, v) => {
                        console.log('Flushing key: ' + k);
                        chrome.storage.sync.remove( k, ()=>{});
                    });
                    ExtOptions.displayMessage( 'FLUSH WHOLE STORAGE WAS CALLED!', 'error', '.status-manipulate-storage', 10000 );
                    ExtOptions.updateStorageInfo();
                    ExtOptions.debugStorageData();
                });
            });
        }
        else    {
            chrome.storage.sync.remove( key, () => {
                ExtOptions.displayMessage( 'Removed key <b>' + key+'</b>', 'info', '.status-manipulate-storage', 30000 );
                ExtOptions.updateStorageInfo();
                ExtOptions.debugStorageData();
            });
        }
    },
    
    setStorageKey: function ( key, value )   {
        if ( !key )
            return ExtOptions.displayMessage( 'Not called - no key name given!', 'error', '.status-manipulate-storage', 10000 );

        if ( !ExtOptions.DEV  &&  key !== 'ext_dev' )
            return ExtOptions.displayMessage( 'Not called - DEV mode must be enabled to execute this request', 'warn', '.status-manipulate-storage', 10000 );

        let storeObj = {};
        storeObj[key] = value;
        chrome.storage.sync.set( storeObj, () => {
            ExtOptions.options[key] = value;
            ExtOptions.displayMessage( 'Storage item set', 'success', '.status-manipulate-storage', 10000 );
            
            ExtOptions.updateStorageInfo();
            ExtOptions.debugStorageData();
        });
    },
    
    permissionOriginGrant: function ( value )   {
        if ( !value )  {
            return;
        }

        value = ExtOptions.controlUrlHostFormat( value );

        chrome.permissions.request({
            origins: [ value ]
        }, function( granted ) {
            if ( chrome.runtime.lastError )    {
                ExtOptions.displayMessage( 'Permission request problem - must be in valid host pattern format. Returned message:<br>'
                        + '<b>' + chrome.runtime.lastError.message + '</b><br><br>'
                        + ' requested url/host: <b>' + value + '</b>'
                    , 'error', '.status-set-permission', 30000 );
            }

            if ( granted )  {
                ExtOptions.displayMessage( 'Permission set. Requested url/host: <b>' + value + '</b>'
                    , 'success', '.status-set-permission', 30000 );
            }
            else    {
                ExtOptions.displayMessage( 'Permission was not set. Requested url/host: <b>' + value + '</b>'
                    , 'warn', '.status-set-permission', 30000 );
            }
        });
    },

    permissionOriginDecline: function ( value )   {
        if ( !value )  {
            return;
        }

        if ( value === '_ALL!' )  {
            chrome.permissions.getAll( function( permissions )  {
                $.each( permissions.origins, function (o, origin)  {
                    ExtOptions.permissionOriginDecline( origin );
                });
            });
            return;
        }

        chrome.permissions.remove({
            origins: [ value ]
        }, function( removed ) {
            if ( chrome.runtime.lastError )    {
                ExtOptions.displayMessage( 'Permission request problem - must be in valid host pattern format. Returned message:<br>'
                        + '<b>' + chrome.runtime.lastError.message + '</b><br><br>'
                        + ' requested url/host: <b>' + value + '</b>'
                    , 'error', '.status-set-permission', 30000 );
            }

            if ( removed )  {
                ExtOptions.displayMessage( 'Origin removed. Requested url/host: <b>' + value + '</b>'
                    , 'success', '.status-set-permission', 30000 );
            }
            else    {
                ExtOptions.displayMessage( 'Origin was not removed. Requested url/host: <b>' + value + '</b>'
                    , 'warn', '.status-set-permission', 30000 );
            }
        });
    },

    handleDarkMode: function() {
    	if ( ExtOptions.options.ext_dark_mode === true ) {
    		$('body').addClass( 'dark' );
        } else {
            $('body').removeClass('dark');
    	}
    },

    /**
     * Build nice checkboxes instead of real ones
     */
    initCheckboxes: function()    {

        // set state of fake checkbox
        let syncState_setFake = function( input, niceCheck )  {
            if ( input.is(':checked') )     niceCheck.addClass('checked');
            else                            niceCheck.removeClass('checked');
        };

        // set back state of input from fake
        let syncState_setReal = function( input, niceCheck )  {
            if ( niceCheck.hasClass('checked') )    input.prop('checked', true);
            else                                       input.prop('checked', false);
        };


        // reversed
        let syncState_setFake_reversed = function( input, niceCheck )  {
            if ( input.is(':checked') )    niceCheck.removeClass('checked');
            else                            niceCheck.addClass('checked');
        };

        let syncState_setReal_reversed = function( input, niceCheck )  {
            if ( niceCheck.hasClass('checked') )    input.prop('checked', false);
            else                                       input.prop('checked', true);
        };


        // process unprocessed checkboxes
        $( '.main input[type="checkbox"]:not(.nice)' ).each(function (i) {
            let input = $(this);
            let inputId = input.prop( 'id' );

            if ( !inputId ) {
                inputId = 'checkbox-'+makeRandomUuid(4);
                input.prop( 'id', inputId );
            }
            let niceCheck = $( '<span class="nice-checkbox" id="nice__'+inputId+'"> ');


            // Make checkbox work inverse (for "disabled" or similar state options)
            if ( input.hasClass( 'inverse' ) )  {
                niceCheck.addClass( 'inverse' );
                syncState_setFake_reversed( input, niceCheck );

                input.on( 'change', function () {
                    syncState_setFake_reversed( input, niceCheck );
                });

                niceCheck.on( 'click', function () {
                    syncState_setReal_reversed( input, niceCheck );
                });

                niceCheck.insertAfter(input);
                input.addClass('nice');
            }
            else    {
                syncState_setFake( input, niceCheck );

                input.on( 'change', function () {
                    syncState_setFake( input, niceCheck );
                });

                niceCheck.on( 'click', function () {
                    syncState_setReal( input, niceCheck );
                });

                niceCheck.insertAfter(input);
                input.addClass('nice');
            }
        });
    }
};


// needed for favicon preview using code from setFavicon.js
favicon_params = {
    'DEV': false,
    'DEBUG': 0,
};







// init
$(function() {
    ExtOptions.init();
    ExtOptions.optionsRestore();
    ExtOptions.updateStorageInfo();
    ExtOptions.debugStorageData();
    ExtOptions.linkRangeInputs();
    ExtOptions.bindFaviconControlsForPreview();
    ExtOptions.bindBadgeControlsForPreview();
    ExtOptions.bindAutosave();
    ExtOptions.initVisualDetails();

	$(document).on('keydown',function(e) {
	    // on escape key press - close last modal/dialog
        if (e.keyCode === 27) {
            if ( !ExtOptions.dialogsOpenStack.length )
                return;

	        let dialogToClose = ExtOptions.dialogsOpenStack[ ExtOptions.dialogsOpenStack.length-1 ];
            ExtOptions.closeDialog( dialogToClose );
        }
    });
});

// bind basic buttons
$( 'button.save' ).click( function (e) {
    ExtOptions.optionsSave( e );
});

$( 'button#toggle_ext_hide_help' ).click( function (e) {
    // get current value, swap, handle action, store in storage (don't trigger full save)
    let extHideHelp_updated = !ExtOptions.options.ext_hide_help
    if ( extHideHelp_updated )  {
        $( 'body' ).addClass('hide-help');
        $( '#toggle_ext_hide_help' ).addClass('toggle_pressed');
    }
    else  {
        $( 'body' ).removeClass('hide-help');
        $( '#toggle_ext_hide_help' ).removeClass('toggle_pressed');
    }
    ExtOptions.setStorageKey( 'ext_hide_help', extHideHelp_updated);
    ExtOptions.options.ext_hide_help = extHideHelp_updated;
});

$( 'button.env_projectAdd' ).click( function () {
    let newProject = ExtOptions.insertProjectItem( {} );
    newProject.removeClass( 'collapse' );
    newProject.find( '[name="project[name]"]' ).focus();
});

$( 'button#env_import' ).on( 'mousedown', function () {
    ExtOptions.importProjectsFromTextarea( {} )
});

$( 'input#env_import_file' ).change( function() {
    ExtOptions.importProjectsFromUpload( this.files );
});

$( 'button#env_export_download' ).click( function() {
    ExtOptions.exportProjectsDownloadFile();
});

$( 'button#flush-storage' ).click( function() {
    ExtOptions.confirmDialog( 'FLUSH STORAGE KEY', 'Are you sure?',function() {
        let $flushStorageKey = $( '#flush-storage-key' );
        ExtOptions.flushStorageKey( $flushStorageKey.val() );
        $flushStorageKey.val('');
    });
});
$( 'button#set-storage-item' ).click( function() {
    let $setStorageKey = $( '#set-storage-key' ),
        $setStorageValue = $( '#set-storage-value' );
    ExtOptions.setStorageKey( $setStorageKey.val(), $setStorageValue.val() );
    $setStorageKey.val('');
    $setStorageValue.val('');
});

$( 'button#origin-grant' ).click( function() {
    let $origin = $( '#origin' );
    ExtOptions.permissionOriginGrant( $origin.val() );
    $origin.val('');
});
$( 'button#origin-decline' ).click( function() {
    let $origin = $( '#origin' );
    ExtOptions.permissionOriginDecline( $origin.val() );
    $origin.val('');
});

$( '#jump-to-top' ).click( function () {
    $('html,body').animate({scrollTop: 0}, 300);
});
$( '#jump-to-projects' ).click( function () {
    $('html,body').animate({scrollTop: $("#settings_block_projects").offset().top - 100}, 300);  // offset correction by heading padding-top
});
$( '#jump-to-importexport' ).click( function () {
    $('html,body').animate({scrollTop: $("#settings_block_importexport").offset().top - 100}, 300);
});
$( '#jump-to-misc' ).click( function () {
    $('html,body').animate({scrollTop: $("#settings_block_miscoptions").offset().top - 100}, 300);
});

$( '#projects-collapse-all' ).click( function (e) {
    ExtOptions.collapseAllProjects();
    e.preventDefault();
});
$( '#projects-expand-all' ).click( function (e) {
    ExtOptions.expandAllProjects();
    e.preventDefault();
});

$( '.projects-container ' ).on('click', '.projectItem .env_projectPush', function (e) {
    let project = $(this).closest('.projectItem');
    RepoHelper.ajaxRequest_pushProject( project, false, $(this) );
});


$( 'textarea#env_importexport-data' )
    .on( 'focus', function() {
        $(this).select();
        $(this).animate({height: 600}, 200);
    })
    .on( 'dblclick', function() {
        $(this).animate({width: 600, height: 800}, 200);
    })
    .on( 'paste', function(){
        $(this).animate({height: 600}, 200);
    })
    .on( 'blur', function(){
        setTimeout(() => {  
            $(this).animate({width: 457, height: 120}, 200);

            // scroll to only if we are lower than textarea begin
            if ( $(document).scrollTop() > $("#settings_block_importexport").offset().top )
                $('html,body').animate({scrollTop: $("#settings_block_importexport").offset().top}, 300);
        }, 150);
    });


// project / env filter (quick search)
$('#projects_filter').on('keyup', function(e) {

    let filterValue = $(this).val().toLowerCase();
    let projectsItemsSet = $('.projects-container .projectItem');

    projectsItemsSet.addClass( 'filtered-out' );


    if ( filterValue )   {
        $( '.projects-filter' ).addClass('active');

        projectsItemsSet.filter( function(index) {
            let found = false;

            // search for the value in project's name
            if ( $(this).find('[name="project[name]"]').val().toLowerCase().indexOf( filterValue ) >= 0 )  {
                found = true;
            }
            
            // search for the value in context urls
            $(this).find('[name="context[url]"]').each(function()  {
                if ( $(this).val().toLowerCase().indexOf( filterValue ) >= 0 )  {
                    found = true;
                    return;
                }
            });

            return found;
        })
        .removeClass( 'filtered-out' );
    }
    else    {
        // reset
        projectsItemsSet.removeClass( 'filtered-out' );
        $( '.projects-filter' ).removeClass('active');
    }
});


$( 'button#projects_filter_reset' ).click( function() {
    $( '.projects-container .projectItem' ).removeClass( 'filtered-out' );
    $( '.projects-filter' ).removeClass('active');
    $( '.projects-filter input' ).val('');
});

// control fetch button de/activation
let controlButtons_env_repo = function (){
    if ( $('#env_repo_url').val() ) {
        $('#env_repo_fetch').attr('disabled', false);
        $('#env_repo_handshake').attr('disabled', false);
        $('#repo_link_external').removeClass('hide').attr('href', $('#env_repo_url').val());
    }
    else    {
        $('#env_repo_fetch').attr('disabled', true);
        $('#env_repo_handshake').attr('disabled', true);
        $('#repo_link_external').addClass('hide').attr('href', '');
    }
};
controlButtons_env_repo();
$('#env_repo_url')
    .on('change paste keyup', function(){
        controlButtons_env_repo()
    })
    .trigger('change');

// bind the repo fetch button
$( '#env_repo_fetch' ).click( function () {
    RepoHelper.repoFetchDialog();
});
// bind the handshake repo button
$('#env_repo_handshake').on('click', function() {
    RepoHelper.ajaxRequest_handshake($(this));
});
// bind the repo help button
$('#env_repo_help').on('click', function() {
    RepoHelper.repoHelpDialog($(this));
});


$( document ).click(function(e) {
    let container = $( '.projects-container' );
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0)    {
        $('.projectItem').removeClass('active-focus');
    }
});

    // some debug. should be disabled later
    /*chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
            var storageChange = changes[key];
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
        }
    });*/


/**
 * Random id string generator
 * @returns string
 * @param length int
 */
function makeRandomUuid(length) {
    return Math.random().toString(36).replace(/[^a-z,A-Z,0-9]+/g, '').substr(1, length+1)
}


/**
 * Simple hash generating from string
 * @param str
 * @returns {number}
 */
function hashCode(str)  {
    if (typeof str === 'undefined')
        return;
    var hash = 0;
    var char;
    if (str.length === 0)
        return hash;
    for (var i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


/**
 * Different one, maybe better - testing in array comparison
 * @param str
 * @param seed
 * @return {number}
 */
const cyrb53 = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

