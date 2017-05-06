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

console.log('start ext!');

// store current tab for reuse - if base tag not found, redirect in old-way
var _tab;


// on click action inject the script to current page
chrome.browserAction.onClicked.addListener(function (tab) {

  _tab = tab;
  //console.log('action clicked - inject the script into document');

  chrome.tabs.executeScript(null, {

    file: "getBaseHref.js"

  }, function() {
    // on system pages you can't inject any scripts
    if (chrome.runtime.lastError) {
      console.warning('Error injecting script: \n' + chrome.runtime.lastError.message);
      console.warning('You\'re probably trying to use this extension on some Chrome\'s system page.');
    }
  });
});



// when the injected script gets the content, it sends it using message request, so we get this message here
chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {

    var baseHref = request.source;

    console.info('baseHref: ' + baseHref);
    //console.log('tab object: ' + _tab);

    // if base tag cannot be read
    if (!baseHref  &&  _tab  &&  _tab.url) {
      // thanks to Patrick Lischka for inspirations and his "Fast TYPO3 CMS Backend switch" that I've used for a long time
      // especially for this regexp :)
      //baseHref = _tab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[0];

      // extract scheme + domain
      var url = _tab.url.toString();
      var parts = url.split('/');
      baseHref = parts[0]+'//'+parts[2];

        console.log('url: '+url);
        console.log(parts);
        console.log(baseHref);
    }

    // strip trailing slash, if present
    baseHref = baseHref.replace(/\/$/, "");

    // finally open TYPO3 backend tab next to current page:
    chrome.tabs.create({
      'url':    baseHref + '/typo3/',
      'index':  _tab.index + 1
    });

    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"BE"});
  }
});


