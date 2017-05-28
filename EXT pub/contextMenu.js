
console.log('contextMenu.js loaded');

// icon submenu


// get configuration and use defaults if not configured (if null as first param: get all)
chrome.storage.sync.get({
        switch_fe_openSelectedPageUid: true,
        switch_be_useBaseHref: true
    },
    function(options) {
        contextMenu(options);
});



function contextMenu()  {

    chrome.contextMenus.create({
        title: "TYPO3 Switcher",
        type: "normal",
        contexts: ["browser_action", "page"],
        onclick: function() {
            alert('first');
        }

        /*"id": "parent"
        "parentId": "parent"*/
    });
}



// in case of error: use chrome.runtime.lastError in callback