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

        var projects = ExtOptions.collectEnvSettings();
    
        chrome.storage.sync.set({
    
            'switch_fe_openSelectedPageUid' :   $( '#switch_fe_openSelectedPageUid' ).is( ':checked' ),
            'switch_be_useBaseHref' :           $( '#switch_be_useBaseHref' ).is( ':checked' ),
            'env_enable' :                      $( '#env_enable' ).is( ':checked' ),
            'env_switching' :                   $( '#env_switching' ).is( ':checked' ),
            'env_menu_show_allprojects' :       $( '#env_menu_show_allprojects' ).is( ':checked' ),
            'env_menu_show_installtool' :       $( '#env_menu_show_installtool' ).is( ':checked' ),
            'env_badge' :                       $( '#env_badge' ).is( ':checked' ),
            'env_badge_projectname' :           $( '#env_badge_projectname' ).is( ':checked' ),
            'env_badge_position' :              $( '#env_badge_position_right' ).is( ':checked' )  ?  'right'  :  'left',
            'env_badge_scale' :                 $( '#env_badge_scale' ).val(),
            'env_favicon' :                     $( '#env_favicon' ).is( ':checked' ),
            'ext_debug' :                       $( '#ext_debug' ).is( ':checked' )

        }, function() {

            // in case of problems show info and end operation
            if (chrome.runtime.lastError)   {
                ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, null, 100000 );
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
                        ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, null, 100000 );
                    }
                    else    {
                        ExtOptions.displayMessage( 'Options saved.' );

                        // store projects number
                        chrome.storage.sync.set({
                            'env_projects_count' : Object.keys(projects).length     // this is the way to read number of elements of an object (like array length)
                            //'env_projects' :    // remove old-way saved projects from storage (uncomment in few versions, to cleanup. now leave for keeping backup)
                        }, function() {
                            //console.log('env_projects_count: ' + Object.keys(projects).length);
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
            'env_projects_count' :              0,      // new project store way saves projects counter, so it means it's after migration
            'env_enable' :                      true,
            'env_switching' :                   true,
            'env_menu_show_allprojects' :       true,
            'env_menu_show_installtool' :       true,
            'env_badge' :                       true,
            'env_badge_projectname' :           true,
            'env_badge_position' :              'left',
            'env_badge_scale' :                 '1.0',
            'env_favicon' :                     false,  // for now when testing disable by default
            'ext_debug' :                       false

        }, function(options) {

            $( '#switch_fe_openSelectedPageUid' ).attr( 'checked',  options.switch_fe_openSelectedPageUid );
            $( '#switch_be_useBaseHref' ).attr( 'checked',          options.switch_be_useBaseHref );
            $( '#env_enable' ).attr( 'checked',                     options.env_enable );
            $( '#env_switching' ).attr( 'checked',                  options.env_switching );
            $( '#env_menu_show_allprojects' ).attr( 'checked',      options.env_menu_show_allprojects );
            $( '#env_menu_show_installtool' ).attr( 'checked',      options.env_menu_show_installtool );
            $( '#env_badge' ).attr( 'checked',                      options.env_badge );
            $( '#env_badge_projectname' ).attr( 'checked',          options.env_badge_projectname );
            $( '#env_badge_position_left' ).attr( 'checked',        options.env_badge_position === 'left' );
            $( '#env_badge_position_right' ).attr( 'checked',       options.env_badge_position === 'right' );
            $( '#env_badge_scale' ).val(                            options.env_badge_scale );
            $( '#ext_debug' ).attr( 'checked',                      options.ext_debug );
            $( '#env_favicon' ).attr( 'checked',                    options.env_favicon );

            ExtOptions.DEV = options.ext_debug;
            ExtOptions.options = options;

            // if count is saved, it means the separated projects save method is used / after migration
            if (options.env_projects_count) {
                // read all options and extract projects
                // read them separately from above, to keep possibility to set defaults on read
                chrome.storage.sync.get(null, function(allOptions)    {
                    var i;
                    var projects = [];
                    for (i = 0; i < options.env_projects_count; i++)    {
                        projects.push(allOptions['proj_'+i]);
                    }

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

        //project.prop( 'id', hashCode( projectItem.name ) );

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
        else    {
            project.find( '.env_contextAddDefaultSet' ).css( 'display', 'inline-block' );
        }

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
            ExtOptions.confirmDialog( 'Delete project - are you sure?', function() {
                ExtOptions.deleteProjectItem( project );
            });
        });
        project.find( '> .hide input' ).on( 'change', function() {
            project.toggleClass( 'hidden' );
        });
        project.find( '.toggle.project' ).click( function() {
            project.toggleClass( 'collapse' );
        });

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
        $( project ).remove();
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
    collectEnvSettings : function()   {
        var projects = {};
        var counter = 0;
        $( '.settings-block.projects .projects-container .projectItem' ).each( function()  {
            var projectItem = {};
            projectItem['name'] = $(this).find( "[name='project[name]']" ).val();
            projectItem['hidden'] = $(this).find( "[name='project[hidden]']" ).is( ':checked' );
            projectItem['contexts'] = [];
            projectItem['links'] = [];

            $(this).find( '.contexts-container .contextItem' ).each( function() {
                var contextItem = {};
                contextItem['name'] = $(this).find( "[name='context[name]']" ).val();
                contextItem['url'] = $(this).find( "[name='context[url]']" ).val();
                contextItem['color'] = $(this).find( "[name='context[color]']" ).val();
                contextItem['hidden'] = $(this).find( "[name='context[hidden]']" ).is( ':checked' );

                projectItem['contexts'].push( contextItem );
            });

            $(this).find( '.links-container .linkItem' ).each( function() {
                var linkItem = {};
                linkItem['name'] = $(this).find( "[name='link[name]']" ).val();
                linkItem['url'] = $(this).find( "[name='link[url]']" ).val();
                linkItem['hidden'] = $(this).find( "[name='link[hidden]']" ).is( ':checked' );

                projectItem['links'].push( linkItem );
            });

            projects['proj_'+counter] = projectItem;
            counter++;
        });
        console.info('collectEnvSettings - projects: ', projects);
        return projects;
    },


    /**
     *
     * @param projects array
     */
    populateEnvSettings : function(projects)   {
        // console.info('called: ExtOptions.populateEnvSettings');
        // console.info('projects from conf:', projects);

        $.each( projects, function(i, projectItem)    {

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


    fillExportData : function ( env_projects ) {
        $( '#env_importexport-data' ).html(
            JSON.stringify( env_projects, null, 4 )
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
            }

            ExtOptions.populateEnvSettings( importData );

            if ( !$( '#env_import_test' ).is( ':checked' ) ) {
                ExtOptions.optionsSave();
                ExtOptions.displayMessage( 'Environments / projects imported', '.status-import', 99999 );
            }
            else    {
                ExtOptions.displayMessage( 'Environments / projects imported - TEST IMPORT - not autosaved', '.status-import', 99999 );
            }

        } catch(e)   {
            if ( ExtOptions.DEV )
                console.log(e);
            ExtOptions.displayMessage( 'JSON parsing problem. Message: <br>' + e.message, '.status-import', 99999 );
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
            ExtOptions.displayMessage( 'File reader problem', '.status-import', 99999 );
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


    exportProjectsDownloadFile : function() {
        //var data = new Blob( [ JSON.stringify( ExtOptions.options.env_projects, null, 4 ) ], {type: 'text/json'} );
        //var url = window.URL.createObjectURL( data );
        var url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify( ExtOptions.options.env_projects, null, 4 ) + '\n');
        //console.log(data);
        //console.log(url);
        var a = document.createElement( "a" );
        document.body.appendChild( a );
        a.style = "display: none";
        a.href = url;
        a.download = 't3switcher-projects.json';
        a.click();
        a.remove();
        //window.URL.revokeObjectURL( url );
    },



    // HELPERS



    /**
     * Display a notice
     * @param msg string
     * @param target string - element selector
     * @param time integer - displaying time of the message
     */
    displayMessage : function(msg, target, time)   {
        if ( typeof time !== 'number' )   time = 2000;
        if ( typeof target !== 'string' )  target = '.status-save';

        var status = $( target );
        status.html( msg );
        setTimeout( function() {
            status.html('');
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
        var envSettings = ExtOptions.collectEnvSettings();
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
    }

};








// init
$(function() {
    ExtOptions.optionsRestore();
    ExtOptions.updateStorageInfo();
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
