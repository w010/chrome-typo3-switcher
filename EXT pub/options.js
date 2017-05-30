/**
 * based on https://developer.chrome.com/extensions/optionsV2
 */

// init
$(function() {
    ExtOptions.optionsRestore();
    ExtOptions.updateStorageInfo();
    ExtOptions.debugStorageData();
});

// bind basic buttons
$( 'button#save' ).click( function () {
    ExtOptions.optionsSave();
    //ExtOptions.debugSaveEnv();
});

$( 'button.env_projectAdd' ).click( function () {
    ExtOptions.insertProjectItem( {} )
});

$( 'button#env_import' ).click( function () {
    ExtOptions.importProjects( {} )
});



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





var ExtOptions = {

    DEV : true,

    
    /**
     * Saves options to chrome.storage.sync.
     */
    optionsSave : function() {

        var env_projects = ExtOptions.collectEnvSettings();
    
        chrome.storage.sync.set({
    
            'switch_fe_openSelectedPageUid':  $( '#switch_fe_openSelectedPageUid' ).is( ':checked' ),
            'switch_be_useBaseHref':          $( '#switch_be_useBaseHref' ).is( ':checked' ),
            'env_projects':                   env_projects
    
        }, function() {
            // update storage info
            ExtOptions.updateStorageInfo();
            ExtOptions.debugStorageData();
            ExtOptions.fillExportData( env_projects );
            // update status message
            ExtOptions.displayMessage( 'Options saved.' );
        });
    },

    /**
     * Restores select box and checkbox state using the preferences
     * stored in chrome.storage
     */
    optionsRestore : function() {

        chrome.storage.sync.get({

            // Set default values on read if not found
            'switch_fe_openSelectedPageUid':  true,
            'switch_be_useBaseHref':          true,
            'env_projects':                   []

        }, function(options) {

            $( '#switch_fe_openSelectedPageUid' ).attr( 'checked',  options.switch_fe_openSelectedPageUid );
            $( '#switch_be_useBaseHref' ).attr( 'checked',          options.switch_be_useBaseHref );
            ExtOptions.populateEnvSettings(                         options.env_projects );

            ExtOptions.fillExportData( options.env_projects );

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
        project.find( "[name='project[name]']" ).val( projectItem.name );
        project.find( "[name='project[hidden]']" ).prop( 'checked', projectItem.hidden );

        // todo: check what if no .contexts
        if (projectItem.contexts !== typeof undefined) {
            $.each(projectItem.contexts, function (i, contextItem) {
                ExtOptions.insertContextItem( project, contextItem );
            });
        }

        // todo: check what if no .links
        if (projectItem.links !== typeof undefined) {
            $.each(projectItem.links, function (i, linkItem) {
                ExtOptions.insertLinkItem( project, linkItem );
            });
        }

        // bind buttons
        project.find( 'button.env_contextAdd' ).click( function() {
            ExtOptions.insertContextItem( project, {} );
        });
        project.find( 'button.env_linkAdd' ).click( function() {
            ExtOptions.insertLinkItem( project, {} );
        });
        project.find( 'button.env_projectRemove' ).click( function() {
            ExtOptions.confirmDialog( 'Delete project - are you sure?', function() {
                ExtOptions.deleteProjectItem( project );
            });
        });
        project.find( '.toggle' ).click( function() {
            project.toggleClass( 'collapse' );
        });
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

        // bind buttons
        context.find( 'button.env_contextRemove' ).click( function() {
            ExtOptions.confirmDialog( 'Delete context - are you sure?', function() {
                ExtOptions.deleteContextItem( context );
            });
        });

        // color picker - set text input
        context.find( 'input.color-picker' ).on( 'change', function() {
            console.log('picker changed');
            console.log(context);
            context.find( 'input.color-text' ).val( $(this).val() );
        });
        // color input - set picker color
        context.find( 'input.color-text' ).on( 'keyup', function() {
            console.log('color text changed');
            console.log(context);
            // add # on beginning if not there
            if ( !( /^#/.test( $(this).val() ) ) )
                $(this).val( '#' + $(this).val() );

            if ( $(this).val().length === 7 )
                context.find( 'input.color-picker' ).val( $(this).val() );
        });
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

        // bind buttons
        link.find( 'button.env_linkRemove' ).click( function() {
            ExtOptions.confirmDialog( 'Delete link - are you sure?', function() {
                ExtOptions.deleteLinkItem( link );
            });
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
     */
    deleteContextItem : function(context)   {
        $( context ).remove();
    },

    /**
     * Delete link
     * @param link element
     */
    deleteLinkItem : function(link)   {
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

            // todo: get contexts & links items

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
        console.info('called: ExtOptions.populateEnvSettings');
        console.info('projects from conf:', projects);

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
            ExtOptions.displayMessage( 'Environments / projects imported', '#status-import', 99999 );
            ExtOptions.optionsSave();

        } catch(e)   {
            //console.log(e.message);
            ExtOptions.displayMessage( 'JSON parsing problem. Message: <br>' + e.message, '#status-import', 99999 );
        }

        console.log( importData );
    },




    // HELPERS


    displayMessage : function(msg, target, time)   {
        if (typeof time !== "number")   time = 2000;
        if (typeof target !== "string")  target = '#status';

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
        if (typeof callbackConfirm !== "function")  callbackConfirm = function(){};
        if (typeof callbackDecline !== "function")  callbackDecline = function(){};

        var dialog_overlay = $( '<div class="dialog-overlay">' );
        var dialog = $( '<div class="dialog">' );
        $('body').append( dialog_overlay ).append( dialog );
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
        if ( !ExtOptions.DEV )    return;
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