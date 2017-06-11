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

    
    /**
     * Saves options to chrome.storage.sync.
     */
    optionsSave : function() {

        var env_projects = ExtOptions.collectEnvSettings();
    
        chrome.storage.sync.set({
    
            'switch_fe_openSelectedPageUid' :   $( '#switch_fe_openSelectedPageUid' ).is( ':checked' ),
            'switch_be_useBaseHref' :           $( '#switch_be_useBaseHref' ).is( ':checked' ),
            'env_projects' :                    env_projects,
            'env_enable' :                      $( '#env_enable' ).is( ':checked' ),
            'env_switching' :                   $( '#env_switching' ).is( ':checked' ),
            'env_badge' :                       $( '#env_badge' ).is( ':checked' ),
            'env_badge_projectname' :           $( '#env_badge_projectname' ).is( ':checked' ),
            'env_badge_position' :              $( '#env_badge_position_right' ).is( ':checked' )  ?  'right' : 'left',
            'env_badge_scale' :                 $( '#env_badge_scale' ).val(),
            'ext_debug' :                       $( '#ext_debug' ).is( ':checked' )

        }, function() {
            // update storage info
            ExtOptions.updateStorageInfo();
            ExtOptions.debugStorageData();
            ExtOptions.fillExportData( env_projects );
            // update status message
            ExtOptions.displayMessage( 'Options saved.' );
            // reload extension to reapply settings
            chrome.extension.getBackgroundPage().window.location.reload();
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
            'env_projects' :                    [],
            'env_enable' :                      true,
            'env_switching' :                   true,
            'env_badge' :                       true,
            'env_badge_projectname' :           true,
            'env_badge_position' :              'left',
            'env_badge_scale' :                 '1.0',
            'ext_debug' :                       false

        }, function(options) {

            $( '#switch_fe_openSelectedPageUid' ).attr( 'checked',  options.switch_fe_openSelectedPageUid );
            $( '#switch_be_useBaseHref' ).attr( 'checked',          options.switch_be_useBaseHref );
            $( '#env_enable' ).attr( 'checked',                     options.env_enable );
            $( '#env_switching' ).attr( 'checked',                  options.env_switching );
            $( '#env_badge' ).attr( 'checked',                      options.env_badge );
            $( '#env_badge_projectname' ).attr( 'checked',          options.env_badge_projectname );
            $( '#env_badge_position_left' ).attr( 'checked',        options.env_badge_position === 'left' );
            $( '#env_badge_position_right' ).attr( 'checked',       options.env_badge_position === 'right' );
            $( '#env_badge_scale' ).val(                            options.env_badge_scale );
            $( '#ext_debug' ).attr( 'checked',                      options.ext_debug );

            ExtOptions.DEV = options.ext_debug;

            ExtOptions.populateEnvSettings(                         options.env_projects );
            ExtOptions.fillExportData( options.env_projects );
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
        project.find( '.toggle' ).click( function() {
            project.toggleClass( 'collapse' );
        });

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
                "name": "PRODUCTION"
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
        var projects = [];
        $( '.settings-block.environments .projects-container .projectItem' ).each( function()  {
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

            projects.push( projectItem );
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
            console.log(projectItem);

            ExtOptions.insertProjectItem( projectItem );
        });

    },



    // IMPORT / EXPORT


    fillExportData : function ( env_projects ) {
        $( '#env_importexport-data' ).html(
            JSON.stringify( env_projects, null, 4 )
        );
    },


    importProjects : function ()    {
        var importData = [];
        try {
            importData = JSON.parse( $( '#env_importexport-data' ).val() );

            if ( $( '#env_import_overwrite' ).is(':checked') )  {
                $( '.projects-container' ).empty();
            }

            ExtOptions.populateEnvSettings( importData );
            ExtOptions.displayMessage( 'Environments / projects imported', '.status-import', 99999 );

            if ( !$( '#env_import_test' ).is( ':checked' ) )
                ExtOptions.optionsSave();

        } catch(e)   {
            //console.log(e.message);
            ExtOptions.displayMessage( 'JSON parsing problem. Message: <br>' + e.message, '.status-import', 99999 );
        }

        console.log( importData );
    },




    // HELPERS


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
        if ( !ExtOptions.DEV )    return;
        console.log('called: ExtOptions.debugStorageData');
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
    ExtOptions.importProjects( {} )
});




    // some debug. should be disabled later
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
            var storageChange = changes[key];
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
        }
    });


