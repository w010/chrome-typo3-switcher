/**
 * based on https://developer.chrome.com/extensions/optionsV2
 */

// Saves options to chrome.storage.sync.
function save_options() {

    chrome.storage.sync.set({

        switch_fe_openSelectedPageUid:  $('#switch_fe_openSelectedPageUid').checked,
        switch_be_useBaseHref:          $('#switch_be_useBaseHref').checked

    }, function() {
        // Update status
        console.log('options saved');
        var status = $('#status');
        status.html ('Options saved.');
        setTimeout(function() {
            status.html('');
        }, 1000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Set default values on read if not found
    chrome.storage.sync.get({

        switch_fe_openSelectedPageUid:  true,
        switch_be_useBaseHref:          true

    }, function(options) {

        $('#switch_fe_openSelectedPageUid').checked =  options.switch_fe_openSelectedPageUid;
        $('#switch_be_useBaseHref').checked =          options.switch_be_useBaseHref;

    });
}


/*document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);*/

$(function(){                   restore_options();  });
$('#save').click(function () {  save_options();     });



$('button.env_projectAdd').click(function () {
    insertProjectItem({})
});





/**
 * Add project item block
 * @param data object
 */
function insertProjectItem(data)   {
    var project = $('.projectItem._template').clone().removeClass('_template')
        .appendTo( $('.projects-container') );

    // bind buttons
    project.find('button.env_contextAdd').click(function () {
        console.log('add context click');
        insertContextItem(project, {});
    });
    project.find('button.env_linkAdd').click(function () {
        insertLinkItem(project, {});
    });
    project.find('button.env_projectRemove').click(function () {
        confirmDialog('Delete project - are you sure?', function() {
            deleteProjectItem(project);
        });
    });
}

/**
 * Add env context block
 * @param project element
 * @param data object
 */
function insertContextItem(project, data)   {
    var context = $(project).find('.contextItem._template').clone().removeClass('_template')
        .appendTo( $(project).find('.contexts-container') );

    // bind buttons
    context.find('button.env_contextRemove').click(function () {
        confirmDialog('Delete context - are you sure?', function() {
            deleteContextItem(context);
        });
    });
}

/**
 * Add link block
 * @param project element
 * @param data object
 */
function insertLinkItem(project, data)   {
    var link = $(project).find('.linkItem._template').clone().removeClass('_template')
        .appendTo( $(project).find('.links-container') );

    // bind buttons
    link.find('button.env_linkRemove').click(function () {
        confirmDialog('Delete link - are you sure?', function() {
            deleteLinkItem(link);
        });
    });
}



/**
 * Delete project
 * @param project element
 */
function deleteProjectItem(project)   {
    $(project).remove();
}

/**
 * Delete context
 * @param context element
 */
function deleteContextItem(context)   {
    $(context).remove();
}

/**
 * Delete link
 * @param link element
 */
function deleteLinkItem(link)   {
    $(link).remove();
}


/**
 * Simple modal dialog with Yes / No buttons
 * @param message
 * @param callbackConfirm
 * @param callbackDecline
 */
function confirmDialog(message, callbackConfirm, callbackDecline)   {
    if (typeof callbackConfirm !== "function")  callbackConfirm = function(){};
    if (typeof callbackDecline !== "function")  callbackDecline = function(){};

    var dialog_overlay = $('<div class="dialog-overlay">');
    var dialog = $('<div class="dialog">');
    $('body').append(dialog_overlay).append(dialog);
    var dialog_inner = $('<div class="dialog-inner">')
        .append( $('<h3>').html( message ) )
        .append( $('<button class="confirm">').click( function(){
            callbackConfirm();
            closeDialog(dialog);
        }).html('Yes') )
        .append( $('<button class="decline">').click( function() {
            callbackDecline();
            closeDialog(dialog);
        }).html('No') )
        .appendTo( dialog );
}

function closeDialog(dialog)  {
    $(dialog).remove();
    $('.dialog-overlay').remove();
}