/**
 * based on https://developer.chrome.com/extensions/optionsV2
 */

// Saves options to chrome.storage.sync.
function save_options() {

    chrome.storage.sync.set({

        switch_fe_openSelectedPageUid:  document.getElementById('switch_fe_openSelectedPageUid').checked,
        switch_be_useBaseHref:          document.getElementById('switch_be_useBaseHref').checked

    }, function() {
        // Update status
        console.log('options saved');
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
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

        document.getElementById('switch_fe_openSelectedPageUid').checked =  options.switch_fe_openSelectedPageUid;
        document.getElementById('switch_be_useBaseHref').checked =          options.switch_be_useBaseHref;

    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);