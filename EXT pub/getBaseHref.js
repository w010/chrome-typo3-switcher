

//console.log('getPageSource.js successfully injected');


function getBaseHref() {

  var base = document.querySelector('base');
  var baseHref = base  &&  base.href || '';

  // quick visual test
  /*if (baseHref) {
    document.body.style.backgroundColor = "green";
    console.info('baseHref: ' + baseHref);
  } else {
    document.body.style.backgroundColor = "red";
    console.info("No <base> tag found");
  }*/

  return baseHref;
}



chrome.runtime.sendMessage({
  action: "baseHref",
  source: getBaseHref()
});

