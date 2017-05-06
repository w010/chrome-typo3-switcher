

console.log('getPageSource.js successfully injected');


function getBaseHref() {

  var base = document.querySelector('base');
  var baseHref = base && base.href || '';

  if (baseHref) {
    document.body.style.backgroundColor = "green";
    console.info('baseHref: ' + baseHref);
  } else {
    document.body.style.backgroundColor = "red";
    console.info("No <base> tag found");
  }

  return baseHref;
}


chrome.runtime.sendMessage({
  action: "getSource",
  source: getBaseHref()
});

