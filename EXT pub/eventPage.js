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


// on click action inject the script to current page
chrome.browserAction.onClicked.addListener(function (tab) {

  // store current tab for reuse - if base tag not found, redirect in old-way
  _currentTab = tab;

  //console.log('action clicked - inject the script into document');

  var url = _currentTab.url.toString();
  var urlParts = url.match(/\/typo3\//);


  // if /typo3/ found in url, click switches to frontend
  if (urlParts) {

    // remove /typo3/ and everything after it in url
    var newTabUrl = url.replace(/typo3\/.*/, "");

    // open TYPO3 Frontend
    chrome.tabs.create({
      'url': newTabUrl,
      'index': _currentTab.index + 1
    });

  }
  // othrwise, try to find proper backend url and open it
  else {

    chrome.tabs.executeScript(null, {

      file: "getBaseHref.js"

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
  if (request.action == "getBaseHref") {

    var baseHref = request.source;

    // note, that this logs only to the extension dev console, not to page devtools.
    console.info('baseHref: ' + baseHref);
    //console.log('tab object: ' + _currentTab);

    // if base tag cannot be read
    if (!baseHref  &&  _currentTab  &&  _currentTab.url) {
      // thanks to Patrick Lischka for inspirations and his "Fast TYPO3 CMS Backend switch" that I've used for a long time
      // especially for this regexp :)
      //baseHref = _currentTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[0];

      // extract scheme + domain
      var url = _currentTab.url.toString();
      var parts = url.split('/');
      baseHref = parts[0] + '//' + parts[2];

        console.log('url: ' + url);
        console.log(parts);
        console.log(baseHref);
    }

    // strip trailing slash, if present
    var newTabUrl = baseHref.replace(/\/$/, "");

    // finally open TYPO3 Backend tab next to current page:
    chrome.tabs.create({
      'url': newTabUrl + '/typo3/',
      'index': _currentTab.index + 1
    });

  }
});


