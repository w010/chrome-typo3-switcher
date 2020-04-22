/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2017
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

    
    /**
     * Saves options to chrome.storage.sync.
     */
    optionsSave : function() {

        var projects = ExtOptions.collectProjects();
    
        chrome.storage.sync.set({
    
            'switch_fe_openSelectedPageUid' :   $( '#switch_fe_openSelectedPageUid' ).is( ':checked' ),
            'switch_be_useBaseHref' :           $( '#switch_be_useBaseHref' ).is( ':checked' ),
            'env_enable' :                      $( '#env_enable' ).is( ':checked' ),
            //'env_switching' :                   $( '#env_switching' ).is( ':checked' ),
            'env_menu_show_allprojects' :       $( '#env_menu_show_allprojects' ).is( ':checked' ),
            'env_menu_show_installtool' :       $( '#env_menu_show_installtool' ).is( ':checked' ),
            'env_menu_show_dump' :              $( '#env_menu_show_dump' ).is( ':checked' ),
            'env_badge' :                       $( '#env_badge' ).is( ':checked' ),
            'env_badge_projectname' :           $( '#env_badge_projectname' ).is( ':checked' ),
            'env_badge_position' :              $( '#env_badge_position_right' ).is( ':checked' )  ?  'right'  :  'left',
            'env_badge_scale' :                 $( '#env_badge_scale' ).val(),
            'env_favicon' :                     $( '#env_favicon' ).is( ':checked' ),
            'env_favicon_alpha' :               $( '#env_favicon_alpha' ).val(),
            'env_favicon_fill' :                $( '#env_favicon_fill' ).val(),
            'env_favicon_position' :            $( '#env_favicon_position' ).val(),
            'env_favicon_composite' :           $( '#env_favicon_composite' ).val(),
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
                    ExtOptions.fillExportData( projects );
                    // update status message and show error if any
                    if (chrome.runtime.lastError)   {
                        ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, 'error', null, 100000 );
                    }
                    else    {
                        ExtOptions.displayMessage( 'Options saved.', 'success' );
                        // blink window after save
                        $('body').addClass('flashContainer');
                        setTimeout(function() { $('body').removeClass('flashContainer'); }, 1000);


                        // store project storing method version
                        chrome.storage.sync.set({
                            'env_projects_storing_version' : 3     // projects as item_[unique id]
                        }, function() {
                            // cleanup projects saved with storing version 2
                            /*for (let i = 0; i < 99; i++) {
                                chrome.storage.sync.remove('proj_' + i);
                            }*/
                            // remove old-way saved projects from storage (uncomment in few versions, to cleanup. now leave for keeping backup)
                            // cleanup projects saved with storing version 1
                            //chrome.storage.sync.remove('env_projects');

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
            'env_projects_storing_version' :    0,      // new project store way is 3, so it means it's after migration. should be 0 by default to make sure the migration will be done
            'env_enable' :                      true,
            //'env_switching' :                   true,
            'env_menu_show_allprojects' :       true,
            'env_menu_show_installtool' :       true,
            'env_menu_show_dump' :              false,
            'env_badge' :                       true,
            'env_badge_projectname' :           true,
            'env_badge_position' :              'left',
            'env_badge_scale' :                 '1.0',
            'env_favicon' :                     true,
            'env_favicon_alpha' :               'TEST1',    // doesn't set this default
            'env_favicon_fill' :                'TEST2',    // doesn't set this default
            'env_favicon_position' :            'bottom',
            'env_favicon_composite' :           'source-over',
            'ext_debug' :                       false

        }, function(options) {
            // due to some weird problems with reading+set default values to some of options, define some defaults manually... chrome.
            if ( !options.env_favicon_alpha )   options.env_favicon_alpha = '0.85';
            if ( !options.env_favicon_fill )   options.env_favicon_fill = '0.25';

            $( '#switch_fe_openSelectedPageUid' ).attr( 'checked',  options.switch_fe_openSelectedPageUid );
            $( '#switch_be_useBaseHref' ).attr( 'checked',          options.switch_be_useBaseHref );
            $( '#env_enable' ).attr( 'checked',                     options.env_enable );
            //$( '#env_switching' ).attr( 'checked',                  options.env_switching );
            $( '#env_menu_show_allprojects' ).attr( 'checked',      options.env_menu_show_allprojects );
            $( '#env_menu_show_installtool' ).attr( 'checked',      options.env_menu_show_installtool );
            $( '#env_menu_show_dump' ).attr( 'checked',             options.env_menu_show_dump );
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
            $( '#ext_debug' ).attr( 'checked',                      options.ext_debug );

            ExtOptions.DEV = options.ext_debug;
            ExtOptions.options = options;

            ExtOptions.setFaviconPreview();
            ExtOptions.setBadgePreview();

            // version 2 means projects stored in separated items, with index. version 3 is items with unique id
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
                    ExtOptions.fillExportData( projects );
                });
            }
            else    {
                ExtOptions.populateEnvSettings( options.env_projects );
                ExtOptions.fillExportData( options.env_projects );
            }

            ExtOptions.debugStorageData();
        });
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
            ExtOptions.confirmDialog( 'Delete project - are you sure?', function() {
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
        project.find( '.contexts-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer' });
        project.find( '.links-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer' });

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
            ExtOptions.confirmDialog( 'Delete context - are you sure?', function() {
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
            ExtOptions.confirmDialog( 'Delete link - are you sure?', function() {
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




    // ENV SETTINGS: READ / WRITE

    /**
     * Iterate projects / environments elements and build an array
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
        // console.info('called: ExtOptions.populateEnvSettings');
        console.info('projects from conf:', projects);
        
        // put them in right order
        projects.sort(function(a, b){
            if (a.sorting > b.sorting)  return 1;
            if (a.sorting < b.sorting)  return -1;
            return 0;
        });
        
        // debugger;
        // console.info('projects from conf:', projects);

        $.each( projects, function(i, projectItem)    {

            // no need to show or export this anywhere. so cleanup
            delete(projectItem.sorting);
            ExtOptions.insertProjectItem( projectItem );

            if ( this.DEV )
                console.log(projectItem);
        });


        // init drag & drop
        $( '.projects-container' ).sortable({ placeholder: 'ui-state-highlight', delay: 150, tolerance: 'pointer' });


        // scroll to last set project on load
        /*if ( typeof this.options._lastProject !== 'undefined'  &&  this.options._lastProject.length > 0 )  {
            var scrollToElement = $( '#' + hashCode( this.options._lastProject.name ) );
            console.log(this.options._lastProject);
            console.log(scrollToElement);
            if ( scrollToElement ) {
                $( window ).scrollTop( scrollToElement.offset().top );
                scrollToElement.toggleClass( 'collapse' );
            }
            chrome.storage.sync.set({ '_lastProject': {} });
        }*/
    },



    // IMPORT / EXPORT


    fillExportData : function ( projects ) {
        $( '#env_importexport-data' ).html(
            JSON.stringify( projects, null, 4 )
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
            filename = 't3switcher-project--'+project.name+'.json';
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
     * @param message string
     * @param callbackConfirm function
     * @param callbackDecline function
     */
    confirmDialog : function(message, callbackConfirm, callbackDecline)   {
        if ( typeof callbackConfirm !== 'function' )  callbackConfirm = function(){};
        if ( typeof callbackDecline !== 'function' )  callbackDecline = function(){};

        var dialog_overlay = $( '<div class="dialog-overlay">' );
        var dialog = $( '<div class="dialog">' );
        $( 'body' ).append( dialog_overlay ).append( dialog );
        var dialog_inner = $( '<div class="dialog-inner">' )
            .append( $( '<h3>' ).html( message ) )
            .append( $( '<button class="confirm">' ).click( function() {
                callbackConfirm();
                ExtOptions.closeDialog( dialog );
            }).html( 'Yes' ) )
            .append( $( '<button class="decline">' ).click( function() {
                callbackDecline();
                ExtOptions.closeDialog( dialog );
            }).html( 'No' ) )
            .appendTo( dialog );
    },

    closeDialog : function(dialog)  {
        $( dialog ).remove();
        $( '.dialog-overlay' ).remove();
    },


    /**
     * Show storage usage
     */
    updateStorageInfo : function()    {
        //if ( !ExtOptions.DEV )    return;
        chrome.storage.sync.getBytesInUse(null, function (bytes) {
            $( '#storageInfo' ).text( 'Bytes in storage: ' + bytes );
        });

        //chrome.storage.sync.clear();
    },

    /**
     * Debug environment data to be saved
     */
    debugSaveEnv : function() {
        if ( !ExtOptions.DEV )    return;
        console.log('called: ExtOptions.debugSaveEnv');
        var envSettings = ExtOptions.collectProjects();
        $( '#debug' ).html( JSON.stringify( envSettings, null, 4 ) );
    },

    /**
     * Debug whole storage saved data
     */
    debugStorageData : function() {
        if ( !ExtOptions.DEV )  return;
        chrome.storage.sync.get( null, function(options) {
            //console.log(options);
            $( '#debug' ).html( 'storage content: \n' + JSON.stringify( options, null, 4 ) );
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
    }
};


// needed for favicon preview using code from setFavicon.js
favicon_params = {
    'DEV' : false
};







// init
$(function() {
    ExtOptions.optionsRestore();
    ExtOptions.updateStorageInfo();
    ExtOptions.linkRangeInputs();
    ExtOptions.bindFaviconControlsForPreview();
    ExtOptions.bindBadgeControlsForPreview();
    ExtOptions.bindAutosave();
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

$( 'button#env_import' ).click( function () {
    ExtOptions.importProjectsFromTextarea( {} )
});

$( 'input#env_import_file' ).change( function() {
    ExtOptions.importProjectsFromUpload( this.files );
});

$( 'button#env_export_download' ).click( function() {
    ExtOptions.exportProjectsDownloadFile();
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
