/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017-2020
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Options screen script
 * @see https://developer.chrome.com/extensions/optionsV2
 */





var ExtOptions = {

    DEV : false,
    options : {},

    dialogToCloseOnGlobalEvents : null,
    
    /**
     * Saves options to chrome.storage.sync.
     */
    optionsSave : function() {

        // sort projects - I think it's best to run sorting at this stage
        if ( $( '#env_projects_autosorting' ).is( ':checked' ) ) {
            let sortedProjects = $( '.projects-container .projectItem' ).sort(function(a, b) {
                return $(a).find( '[name="project[name]"]' ).val().toUpperCase().localeCompare( 
                    $(b).find( '[name="project[name]"]' ).val().toUpperCase() );
            });
            sortedProjects.appendTo( $( '.projects-container' ) );
        }

        var projects = ExtOptions.collectProjects();
    
        chrome.storage.sync.set({
    
            'switch_fe_openSelectedPageUid' :   $( '#switch_fe_openSelectedPageUid' ).is( ':checked' ),
            'switch_be_useBaseHref' :           $( '#switch_be_useBaseHref' ).is( ':checked' ),
            'env_enable' :                      $( '#env_enable' ).is( ':checked' ),
            //'env_switching' :                   $( '#env_switching' ).is( ':checked' ),
            'env_menu_show_allprojects' :       $( '#env_menu_show_allprojects' ).is( ':checked' ),
            'env_menu_short_custom1' :          $( '#env_menu_short_custom1' ).val(),
            'env_menu_short_custom2' :          $( '#env_menu_short_custom2' ).val(),
            'env_badge' :                       $( '#env_badge' ).is( ':checked' ),
            'env_badge_projectname' :           $( '#env_badge_projectname' ).is( ':checked' ),
            'env_badge_position' :              $( '#env_badge_position_right' ).is( ':checked' )  ?  'right'  :  'left',
            'env_badge_scale' :                 $( '#env_badge_scale' ).val(),
            'env_favicon' :                     $( '#env_favicon' ).is( ':checked' ),
            'env_favicon_alpha' :               $( '#env_favicon_alpha' ).val(),
            'env_favicon_fill' :                $( '#env_favicon_fill' ).val(),
            'env_favicon_position' :            $( '#env_favicon_position' ).val(),
            'env_favicon_composite' :           $( '#env_favicon_composite' ).val(),
            'env_projects_autosorting' :        $( '#env_projects_autosorting' ).is( ':checked' ),
            'ext_debug' :                       $( '#ext_debug' ).is( ':checked' )

        }, function() {

            // in case of problems show info and end operation
            if (chrome.runtime.lastError)   {
                ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, 'error', null, 100000 );
            }
            // if options saved ok, now save projects
            else    {

                chrome.storage.sync.set(

                    projects

                , function() {
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
                        // blink window after save
                        $('body').addClass('flashContainer');
                        setTimeout(function() { $('body').removeClass('flashContainer'); }, 1000);


                        // finish migration - try to make sure it's ready to cleanup - proceed if some current projects exists.
                        // empty array may mean that importing of old items failed - better keep them in storage, there's always a chance to retrieve them
                        if ( Object.keys(projects).length > 0 )   {
                            // remove old (method 1) projects key from storage
                            chrome.storage.sync.remove( 'env_projects' );
                            console.log( 'update: project storing method migrated to method version 3' )
                        }
                        

                        chrome.storage.sync.set({
                            // store project storing method version
                            'env_projects_storing_version' : 3     // projects as item_[unique id]
                        }, function() {
                            // cleanup projects saved with storing version 2
                            /*for (let i = 0; i < 99; i++) {
                                chrome.storage.sync.remove('proj_' + i);
                            }*/

                            // if settings + projects was saved successfully, we can assume this was too. so no need to check again
                            // reload extension to reapply settings
                            chrome.extension.getBackgroundPage().window.location.reload();
                        });

                    }
                });

            }
        });
    },

    /**
     * Restores select box and checkbox state using the preferences
     * stored in chrome.storage
     */
    optionsRestore : function() {

        chrome.storage.sync.get({

            // Set default values on read if not found
            'switch_fe_openSelectedPageUid' :   true,
            'switch_be_useBaseHref' :           true,
            'env_projects' :                    [],     // leave for compatibility - must try to read old projects array to migrate
            'env_projects_storing_version' :    1,      // version 1 is original all-projects-one-key method. version 2 means projects stored in separated items, with index and counter. version 3 is items with unique id
            'env_projects_autosorting' :        false,
            'env_enable' :                      true,
            //'env_switching' :                   true,
            'env_menu_show_allprojects' :       true,
            'env_menu_short_custom1' :          '/typo3/install.php',
            'env_menu_short_custom2' :          '',
            'env_badge' :                       true,
            'env_badge_projectname' :           true,
            'env_badge_position' :              'right',
            'env_badge_scale' :                 '1.0',
            'env_favicon' :                     true,
            'env_favicon_alpha' :               '0.85',
            'env_favicon_fill' :                '0.25', 
            'env_favicon_position' :            'bottom',
            'env_favicon_composite' :           'source-over',
            'ext_debug' :                       false,
            'repo_url' :                        '',
            'repo_key' :                        '',

        }, function(options) {

            $( '#switch_fe_openSelectedPageUid' ).attr( 'checked',  options.switch_fe_openSelectedPageUid );
            $( '#switch_be_useBaseHref' ).attr( 'checked',          options.switch_be_useBaseHref );
            $( '#env_enable' ).attr( 'checked',                     options.env_enable );
            //$( '#env_switching' ).attr( 'checked',                  options.env_switching );
            $( '#env_menu_show_allprojects' ).attr( 'checked',      options.env_menu_show_allprojects );
            $( '#env_menu_short_custom1' ).val('' +                    options.env_menu_short_custom1 );
            $( '#env_menu_short_custom2' ).val('' +                    options.env_menu_short_custom2 );
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
            $( '#ext_debug' ).attr( 'checked',                      options.ext_debug );

            ExtOptions.DEV = options.ext_debug;
            ExtOptions.options = options;

            ExtOptions.initFoldableSections();
            
            ExtOptions.setFaviconPreview();
            ExtOptions.setBadgePreview();

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

            ExtOptions.debugStorageData();
        });
    },


    /**
     * 
     */
    handleAddEditUrl : function(url)   {
        
        let urlParts = url.split(/\//); 
        let cleanedUrl = urlParts[0] + '//' + urlParts[2] + '/';
    
        // try to find and expand its project
        let projectsItemsSet = $('.projects-container .projectItem');
        let found = false;
    
        projectsItemsSet.each( function(index, item) {
            // search for the value in context urls
            $(this).find('[name="context[url]"]').each(function()  {
                
                // strip any trailing slash and add (make sure it ends with one, to match no matter if given or not in config)  
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
    
            if (found)
                return;
        });


        // if not in local projects, propose add options
        if ( !found )  {
            // open dialog asking to add to current / make new project / cancel

            let dialogContent = $( '<h3>' ).html( cleanedUrl + '<br><br>' + 'Requested URL is not yet in your local projects. Here\'s what you can do:' );
            let buttonNewProject = $( '<button class="btn add dialog_projectAdd"><span class="icon"></span> <span class="text">Make new Project</span></button>' );
            let buttonNewContext = $( '<button class="btn add dialog_contextAdd"><span class="icon"></span> <span class="text">Add Context to current Project</span></button>' );
            let buttonCancel = $( '<button class="btn cancel"><span class="text" title="Close dialog and discard url">Nothing</span></button>' );


            let dialog = ExtOptions.openDialog('New URL', $( '<div>' )
                .append( dialogContent )
                .append( buttonNewProject )
                .append( buttonNewContext )
                .append( buttonCancel )
            );
    
            dialog.find('.dialog_projectAdd').click( function() {
                // open and prefill Add form
                console.log('open addform');
                var newProject = ExtOptions.insertProjectItem( {} )
                    .removeClass( 'collapse' )
                newProject.find( '.env_contextAdd' ).click();
                newProject.find( '[name="context[url]"]' )
                    .val( cleanedUrl )
                    .focus();

                ExtOptions.closeDialog( dialog );
            });
    
            
            dialog.find('.dialog_contextAdd').click( function() {
// todo: find out how to make the selection of project to add context
                console.log('Add as context for existing project / selection not implemented yet! todo: finish this function');
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
     */
    insertProjectItem : function(projectItem)   {
        var project = $( '.projectItem._template' ).clone().removeClass( '_template' )
            .appendTo( $( '.projects-container' ) );

        if (typeof projectItem.uuid === 'undefined' || !projectItem.uuid)
            projectItem.uuid = makeRandomUuid(6);
        
        project.attr('id', 'project_' + projectItem.uuid);

        // populate data
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
            var context = ExtOptions.insertContextItem( project, {} );
            context.find( '[name="context[name]"]' ).focus();
        });
        project.find( 'button.env_contextAddDefaultSet' ).click( function() {
            ExtOptions.insertDefaultContextSet( project );
        });
        project.find( 'button.env_linkAdd' ).click( function() {
            var link = ExtOptions.insertLinkItem( project, {} );
            link.find( '[name="link[name]"]' ).focus();
        });
        project.find( 'button.env_projectRemove' ).click( function() {
			var trigger = $(this);
			ExtOptions.confirmDialog( 'Delete project', 'Are you sure?',function() {
				ExtOptions.deleteProjectItem( trigger.closest('.projectItem') );
                //ExtOptions.optionsSave(); // probably is problematic to call it right after
            });
        });
        project.find( '> .hide input' ).on( 'change', function() {
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

        return project;
    },

    /**
     * Add env context block
     * @param project element
     * @param contextItem object with data
     */
    insertContextItem : function(project, contextItem)   {
        var context = project.find( '.contextItem._template' ).clone().removeClass( '_template' )
            .appendTo( project.find( '.contexts-container' ) );

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
        context.find( '> .hide input' ).on( 'change', function() {
            context.toggleClass( 'hidden' );
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

        return context;
    },

    /**
     * Add link block
     * @param project element
     * @param linkItem object with data
     */
    insertLinkItem : function(project, linkItem)   {
        var link = project.find( '.linkItem._template' ).clone().removeClass( '_template' )
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
        link.find( '> .hide input' ).on( 'change', function() {
            link.toggleClass( 'hidden' );
        });

        return link;
    },


    /**
     * Add some default contexts
     * @param project
     */
    insertDefaultContextSet : function(project)    {
        var defaultContexts = [{
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
        $.each( defaultContexts, function( i, context ) {
            ExtOptions.insertContextItem( project, context );
        });
    },


    /**
     * Delete project
     * @param project element
     */
    deleteProjectItem : function(project)   {
        var uuid = $(project).attr( "id" ).replace(/^project_+/g, '');
        $( project ).remove();
        chrome.storage.sync.remove( 'project_' + uuid );
        // as long this removing works this way, I mean individual remove() and no global save options, textarea is not refreshing after deleting. so we have to do this manually
        ExtOptions.fillExportData();
    },
    
    
    /**
     * Delete all projects
     */
    deleteAllProjectItems : function()  {
        chrome.storage.sync.get( null, function(allOptions) {
            // find every option which is a project
            $.each(allOptions, function(key, value)    {
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
    deleteContextItem : function(context, project)   {
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
    deleteLinkItem : function(link, project)   {
        $( link ).remove();
    },

    /**
     * After sorting / dropping element 
     */
    sortDropCallback : function()   {
       ExtOptions.fillExportData();
    },



    // ENV SETTINGS: READ / WRITE

    /**
     * Get projects as object of objects. Used only for storage save.
     * Iterate projects / environments and collect data elements.
     * @return object
     */
    collectProjects : function() {
        var projects = {};
        var i = 0; 
        $( '.projects-container .projectItem' ).each( function() {
            var project = ExtOptions.readProjectData( $(this) );
            project.sorting = i++;
            projects[ 'project_' + project.uuid ] = project;
        });
        console.info('collectProjects - projects: ', projects);
        return projects;
    },

     /**
     * Get projects as an array (most cases)
     * @return array 
     */
    getProjectsArray : function() {
        return Object.values( ExtOptions.collectProjects() );
    },

    /**
     * Extract project settings from html representation
     * @param project html object
     * @returns array
     */
    readProjectData : function(project)   {
        var projectItem = {};
        projectItem['name'] = project.find( "[name='project[name]']" ).val();
        projectItem['hidden'] = project.find( "[name='project[hidden]']" ).is( ':checked' );
        projectItem['contexts'] = [];
        projectItem['links'] = [];

        project.find( '.contexts-container .contextItem' ).each( function() {
            var context = $(this);
            var contextItem = {};
            contextItem['name'] = context.find( "[name='context[name]']" ).val();
            contextItem['url'] = context.find( "[name='context[url]']" ).val();
            contextItem['color'] = context.find( "[name='context[color]']" ).val();
            contextItem['hidden'] = context.find( "[name='context[hidden]']" ).is( ':checked' );

            projectItem['contexts'].push( contextItem );
        });

        project.find( '.links-container .linkItem' ).each( function() {
            var link = $(this);
            var linkItem = {};
            linkItem['name'] = link.find( "[name='link[name]']" ).val();
            linkItem['url'] = link.find( "[name='link[url]']" ).val();
            linkItem['hidden'] = link.find( "[name='link[hidden]']" ).is( ':checked' );

            projectItem['links'].push( linkItem );
        });

        var uuid = project.attr( "id" ).toString().replace(/^project_+/g, '');
        if (!uuid)
            uuid = makeRandomUuid(6);

        projectItem.uuid = uuid;
        return projectItem;
    },


    /**
     *
     * @param projects array
     */
    populateEnvSettings : function(projects)   {
        if ( ExtOptions.DEV )
            console.info('projects from conf:', projects);

        if ( !Array.isArray( projects ) )
            projects = [];
        
        // put them in right order
        projects.sort(function(a, b){
            if (a.sorting > b.sorting)  return 1;
            if (a.sorting < b.sorting)  return -1;
            return 0;
        });
        

        $.each( projects, function(i, projectItem)    {

            // no need to show or export this anywhere. so cleanup
            delete(projectItem.sorting);
            ExtOptions.insertProjectItem( projectItem );

            if ( ExtOptions.DEV )
                console.log(projectItem);
        });


        if ( !$( '#env_projects_autosorting' ).is( ':checked' ) ) {
            // init drag & drop
            $( '.projects-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer', update: function() { ExtOptions.sortDropCallback(); } });
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

            ExtOptions.populateEnvSettings( importData );

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
        if ( typeof time !== 'number' )   time = 2000;
        if ( typeof target !== 'string' )  target = '.status-notice';
        if ( typeof errorLevel !== 'string' )  errorLevel = 'info';

        var status = $( target );
        status.removeClass( 'info success warn error' );
        status.addClass( errorLevel );
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
            .add( $( '<button class="btn confirm">' ).html( 'Yes' ) )
            .add( $( '<button class="btn decline">' ).html( 'No' ) );

        let dialog = ExtOptions.openDialog(title, content);

        dialog.find('.confirm').click( function() {
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
     * Dialog about fetching projects from repo
     * @param title string
     * @param message string
     */
    repoDialog : function(title, message)   {
        
        // help info displayed if no repo url set
        let info_repo_default = '';

        if ( !ExtOptions.options.repo_url ) {
            info_repo_default = '<p><a id="repo_test" href="#">Test how it works using example dummy repo</a><br>' +
                'You may easily host your own project repo, <a class="external" href="https://chrome.wolo.pl/projectrepo/" target="_blank">see details how</a>.</p>';
        }

        let content = $( '<div class="repo-config">' +
                '<label>Repo url:</label> <input type="text" id="repo_url"> <label>Key:</label> <input type="text" id="repo_key">' +
                '<button class="btn save" id="repo_config_save"><span class="icon"></span> <span class="text">Save</span></button>' +
                '<div class="notice"></div>' +
            '</div>' +
            '<div class="fetch-inner">' +
                info_repo_default +
                '<div class="fetch-controls">' +
                    '<input type="text" id="repo_fetch_filter" placeholder="Filter by name"> <button class="btn fetch" id="repo_fetch" disabled><span class="icon"></span> <span class="text">Fetch available items list</span></button>' +
                '</div>' +
                '<div class="fetched-projects ajax-target"></div>' +
            '</div>'
        );


        ExtOptions.openDialog(title, content, 'dialog-fetch', function(caller)    {
 
            // set variables from storage, control fetch button de/activation
            $('#repo_url')
                .on('change paste keyup', function(){
                    if ($(this).val()) {
                        $('#repo_fetch').attr('disabled', false);
                    }
                    else    {
                        $('#repo_fetch').attr('disabled', true);
                    }
                })
                .val( ExtOptions.options.repo_url )
                .trigger('change');
            $('#repo_key').val( ExtOptions.options.repo_key );
            
            // bind save repo settings button
            content.find('#repo_config_save').on('click', function() {
                chrome.storage.sync.set({
                    'repo_url' :   $( '#repo_url' ).val(),
                    'repo_key' :   $( '#repo_key' ).val(),
                }, function() {
                    if (chrome.runtime.lastError)   {
                        ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, 'level-error', '.dialog-fetch .repo-config .notice', 100000 );
                    }
                    else    {
                        ExtOptions.displayMessage( 'Saved', 'level-info', '.dialog-fetch .repo-config .notice', 2000 );
                        // have to be set in case of reopen modal to show up-to-date state
                        ExtOptions.options.repo_url = $( '#repo_url' ).val();
                        ExtOptions.options.repo_key = $( '#repo_key' ).val();
                    }
                });
            });

            // bind fetch button
            content.find('#repo_fetch').on('click', function() {
                RepoHelper.fetchProjects(caller);
            });
            
            // on enter key pressed in filter input
            content.find('#repo_fetch_filter').on( 'keypress', function(e) {
                if ( e.which === 13 )       RepoHelper.fetchProjects(caller);
            })
    
            // bind additional test link
            content.find('#repo_test').on('click', function() {
                $('#repo_url')
                    .val('https://chrome.wolo.pl/repoexample/')
                    .trigger('change');
                return false;
            });
        });
    },

    /**
     * Open simple modal dialog
     * @param title string
     * @param content string
     * @param classname
     * @param callback function
     */
    openDialog : function(title, content, classname, callback)   {

        if ( $( 'body > .dialog' ).length === 0 )
            var dialog_overlay = $( '<div class="dialog-overlay">' );
        var dialog = $( '<div class="dialog '+(classname ?? '')+'">' );
        $( 'body' ).append( dialog_overlay ).append( dialog );
        
        $( '<div class="dialog-inner">' )
            .append( $( '<h2 class="dialog-head">' ).html( title ) )
            .append( $( '<span class="dialog-close" title="Close">' ).html( 'X' ).on('click', function(){ ExtOptions.closeDialog( dialog ); }) )
            .append( $( '<div class="dialog-body">' ).html( content ) )
            .appendTo( dialog );

        if (callback instanceof Function) {
            callback( dialog );
        }
        
        ExtOptions.dialogToCloseOnGlobalEvents = dialog; 
        
        return dialog;
    },

    /**
     * Close dialog / remove modal object
     */
    closeDialog : function(dialog)  {
        $( dialog ).remove();
        // sometimes there's more dialogs at once (ie. confirmation popup but called in modal) so remove overlay when there's no more left
        if ( $( 'body > .dialog' ).length === 0 )
            $( 'body > .dialog-overlay' ).remove();
    },

    /**
     * Add loader image into ajax container
     * @param element object
     */
    ajaxAddLoaderImage : function(element)    {
        element.append(
            $('<span class="ajaxloader ajaxloader-size-default ajaxloader-state-default ajaxloader-spin"><span class="ajaxloader-markup"><img src="Images/ajax-loader.svg">')
        );
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

        //chrome.storage.sync.clear();
    },

    /**
     * Debug environment data to be saved
     */
    debugSaveEnv : function() {
        if ( !ExtOptions.DEV )    return;
        console.log('called: ExtOptions.debugSaveEnv');
        var envSettings = ExtOptions.getProjectsArray();
        $( '#debug' ).html( JSON.stringify( envSettings, null, 4 ) );
    },

    /**
     * Debug whole storage saved data
     */
    debugStorageData : function() {
        if ( !ExtOptions.DEV )  return;
        chrome.storage.sync.get( null, function(options) {
            //console.log(options);
            $( '#debugExtInfo' ).html(
                '<h4> Extension info: </h4>' +
                '<p> Version: ' + chrome.runtime.getManifest().version + '<br>' +
                'Id: ' + chrome.runtime.id + '</p><br>'
            );
            $( '#debugStorageContent' ).html(
                '<p> Storage contents: <br>' +
                '<i>(you may want to refresh the page to be 100% sure this content is up-to-date)</i></p>' + 
                '<pre>' + JSON.stringify( options, null, 4 ) + '</pre>'
            );
        });
    },

    /**
     * link range inputs with their text fields
     */
    linkRangeInputs : function()    {
        $( 'input[type=range]' ).each(function(){
            // take range input and find its text input by id
            var range = $(this);
            var text = $( '#' + range.prop('id').replace('__range', '') );
            text.on( 'keyup', function(){
                // prevent typing beyond range's scope
                var value = Math.min(Math.max(text.val(), range.prop('min')), range.prop('max'));
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
    setFaviconPreview : function()  {

        Favicon.DEV = ExtOptions.DEV;

        var faviconUrl = 'Icons/favicon-options-test.ico';
        var newFaviconSrc = '';
        var params = {
            'contextColor' :    '#dd0000',     // preview using red. do we need this configurable?
            'alpha' :           $( '#env_favicon_alpha' ).val(),
            'fill' :            $( '#env_favicon_fill' ).val(),
            'position' :        $( '#env_favicon_position' ).val(),
            'composite' :       $( '#env_favicon_composite' ).val()
        };

        var originalIconImageObject = new Image();
        originalIconImageObject.src = faviconUrl;

        originalIconImageObject.onload = function() {

            var canvas = Favicon.renderFaviconWithOverlay( originalIconImageObject, params );
            newFaviconSrc = canvas.toDataURL();

            $('#favicon-preview').prop('src', newFaviconSrc);
        };
    },

    /**
     * Badge preview - show badge like on normal page to see how it looks
     */
    setBadgePreview : function()    {

        //console.log('refresh badge - remove before setting new one');
        $('.chrome-typo3switcher-badge').remove();

        var badge_params = {
            'DEV' :                 ExtOptions.DEV,
            'projectLabel' :        'Badge',
            'contextLabel' :        'Preview',
            'contextColor' :        '#ff8000',
            'projectLabelDisplay' : $( '#env_badge_projectname' ).prop('checked'),
            'scale' :               parseFloat( $( '#env_badge_scale' ).val() ),
            'position' :            $( 'input[name=badge_position]:checked' ).val(),
        };

        Badge.setBadge(badge_params);
    },

    /**
     * Make any use of favicon config controls auto refresh preview
     */
    bindFaviconControlsForPreview : function()  {
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
    bindBadgeControlsForPreview : function()  {
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
    bindAutosave : function () {
        
        $( '.settings-block' )
            
            // prepare text inputs to check state
            .on( 'change', 'input[type=text]:not(.no-autosave)', function(e) {
                // create custom property - can't check this out-of-the-box
                $(this).data('hasChanged', true);
            })
            
            
            // text: on enter key pressed in text input
            .on( 'keypress', 'input[type=text]:not(.no-autosave)', function(e) {
                if ( e.which === 13 )       ExtOptions.optionsSave();
            })
            // text: on input loose focus 
            .on( 'blur', 'input[type=text]:not(.no-autosave)', function(e) {
                if ($(this).data('hasChanged')) {
                    ExtOptions.optionsSave();
                    $(this).data('hasChanged', false);
                }
            })
            // checkbox: click
            .on( 'click', 'input[type=checkbox]:not(.no-autosave)', function(e) {
                ExtOptions.optionsSave();
            })
            // radio: change
            .on( 'change', 'input[type=radio]:not(.no-autosave)', function(e) {
                ExtOptions.optionsSave();
            })
            // select: change
            .on( 'change', 'select:not(.no-autosave)', function(e) {
                ExtOptions.optionsSave();
            })
            // range: change
            .on( 'change', 'input[type=range]:not(.no-autosave)', function(e) {
                ExtOptions.optionsSave();
            })
            // color: change
            .on( 'change', 'input[type=color]:not(.no-autosave)', function(e) {
                ExtOptions.optionsSave();
            })
            ;
    },
    
    initFoldableSections : function ()  {
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
    
    flushStorageKey : function ( key )   {

        if ( !$('#ext_debug').is( ':checked' ) )  {
            ExtOptions.displayMessage( 'Not called - option Debug must be enabled to execute this request', 'level-error', '#flush-storage-feedback', 10000 );
            return;
        }

        if ( key === '_ALL!')   {
            ExtOptions.confirmDialog( 'FLUSH _WHOLE_ STORAGE REQUESTED!', 'Are you sure, that you\'re sure?',function() {
                // sync.clear() might be used, but this way we can also log every removed item 
                chrome.storage.sync.get( null, function(options) {
                    $.each(options, function(k, v){
                        console.log('Flushing key: ' + k);
                        chrome.storage.sync.remove( k, function() {});
                    });
                    ExtOptions.displayMessage( 'FLUSH WHOLE STORAGE WAS CALLED!', 'level-error', '#flush-storage-feedback', 10000 );
                });
            });
        }
        else    {
            chrome.storage.sync.remove( key, function() {
                ExtOptions.displayMessage( 'Removed key ' + key, 'level-info', '#flush-storage-feedback', 10000 );
            });
        }
    },
};


// needed for favicon preview using code from setFavicon.js
favicon_params = {
    'DEV' : false
};







// init
$(function() {
    ExtOptions.optionsRestore();
    ExtOptions.updateStorageInfo();
    ExtOptions.debugStorageData();
    ExtOptions.linkRangeInputs();
    ExtOptions.bindFaviconControlsForPreview();
    ExtOptions.bindBadgeControlsForPreview();
    ExtOptions.bindAutosave();
	$(document).on('keydown',function(e) {
        if (e.keyCode === 27) {
            ExtOptions.closeDialog( ExtOptions.dialogToCloseOnGlobalEvents );
        }
    });
});

// bind basic buttons
$( 'button.save' ).click( function () {
    ExtOptions.optionsSave();
    //ExtOptions.debugSaveEnv();
});

$( 'button.env_projectAdd' ).click( function () {
    var newProject = ExtOptions.insertProjectItem( {} );
    newProject.removeClass( 'collapse' );
    newProject.find( '[name="project[name]"]' ).focus();
});
$( 'button.env_projectRepo' ).click( function () {
    ExtOptions.repoDialog('Get projects from repository');
});
$( 'button#env_import' ).click( function () {
    ExtOptions.importProjectsFromTextarea( {} )
    $('html,body').animate({scrollTop: $("#settings_block_importexport").offset().top}, 300);
});

$( 'input#env_import_file' ).change( function() {
    ExtOptions.importProjectsFromUpload( this.files );
    $('html,body').animate({scrollTop: $("#settings_block_importexport").offset().top}, 300);
});

$( 'button#env_export_download' ).click( function() {
    ExtOptions.exportProjectsDownloadFile();
});

$( 'button#flush-storage' ).click( function() {
    ExtOptions.confirmDialog( 'FLUSH STORAGE KEY', 'Are you sure?',function() {
        ExtOptions.flushStorageKey( $( '#flush-storage-key' ).val() );
        $( '#flush-storage-key' ).val('');
    });
});

$( '#jump-to-top' ).click( function () {
    $('html,body').animate({scrollTop: 0}, 300);
});
$( '#jump-to-projects' ).click( function () {
    $('html,body').animate({scrollTop: $("#settings_block_projects").offset().top - 100}, 300);  // offset correction by heading padding-top
});
$( '#jump-to-importexport' ).click( function () {
    $('html,body').animate({scrollTop: $("#settings_block_importexport").offset().top - 100}, 300);  // offset correction by heading padding-top
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
        $(this).animate({width: 457, height: 80}, 200);

        // scroll to only if we are lower than textarea begin
        if ( $(document).scrollTop() > $("#settings_block_importexport").offset().top )
            $('html,body').animate({scrollTop: $("#settings_block_importexport").offset().top}, 300);
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

