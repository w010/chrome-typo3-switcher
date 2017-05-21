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



var _currentTab;
var _url;


// on click action inject the script to current page
chrome.browserAction.onClicked.addListener(function (tab) {
  //console.log('action clicked - inject the script into document');

  // store current tab and its url for later
  _currentTab = tab;
  _url = _currentTab.url.toString();

  var urlParts = _url.match(/\/typo3\//);


  // IS IN BACKEND

  // if /typo3/ found in url, click switches to frontend
  if (urlParts) {

    // tries to extract current pid from backend pagetree and sends a message
    chrome.tabs.executeScript(null, {

      file: 'getSelectedPageUid.js'

    }, function () {
        // on system pages you can't inject any scripts
        if (chrome.runtime.lastError) {
            console.warning('Error injecting script: \n' + chrome.runtime.lastError.message);
            console.warning('You\'re probably trying to use this extension on some Chrome\'s system page.');
        }
    });
  }

  // IS IN FRONTEND

  // othrwise, try to find proper backend url and open it
  else {

    chrome.tabs.executeScript(null, {

      file: 'getBaseHref.js'

    }, function () {
      // on system pages you can't inject any scripts
      if (chrome.runtime.lastError) {
        console.warning('Error injecting script: \n' + chrome.runtime.lastError.message);
        console.warning('You\'re probably trying to use this extension on some Chrome\'s system page.');
      }
    });
  }
});





// when the injected script gets the content, it sends it using message request, so we get this message here
chrome.runtime.onMessage.addListener(function(request, sender) {

  var newTabUrl;


  if (request  &&  request.action === 'selectedPageUid' || '') {

    var selectedPageUid = request.source;

    // remove /typo3/ and everything after it in url. add page id, if received
    newTabUrl = _url.replace(/typo3\/.*/, '')
      + (selectedPageUid > 0  ?  '?id=' + selectedPageUid  :  '');

    // note, that this logs only to the extension dev console, not to page devtools.
    console.info('newTabUrl: ' + newTabUrl);

    // open TYPO3 Frontend
    chrome.tabs.create({
        'url': newTabUrl,
        'index': _currentTab.index + 1
    });
  }


  if (request  &&  request.action === 'baseHref' || '') {

    var baseHref = request.source;

    console.info('baseHref: ' + baseHref);
    //console.log('tab object: ' + _currentTab);

	// prevent wrong url if someone sets base to other value than site's address
    if (baseHref === '/'  ||  baseHref === 'auto')	{
		baseHref = '';
    }

    // if base tag cannot be read / no url found, try only a domain
    if (!baseHref  &&  _currentTab  &&  _url) {
      // thanks to Patrick Lischka for inspirations and his "Fast TYPO3 CMS Backend switch" that I've used for a long time
      // especially for this regexp :)
      //baseHref = _currentTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[0];

      // extract scheme + domain
      var parts = _url.split('/');
      baseHref = parts[0] + '//' + parts[2];

        /*console.log('url: ' + _url);
        console.log(parts);
        console.log(baseHref);*/
    }

    // strip trailing slash, if present
    newTabUrl = baseHref.replace(/\/$/, '');

    console.info('newTabUrl: ' + newTabUrl);

    // finally open TYPO3 Backend tab next to current page:
    chrome.tabs.create({
      'url': newTabUrl + '/typo3/',
      'index': _currentTab.index + 1
    });
  }
});





chrome.contextMenus.create({
    "type":"checkbox",
    "checked":true,
    "title":"TEST",
    "contexts":["browser_action"],
    "onclick":function(info, tab) {
        console.log(info);
    }
});
