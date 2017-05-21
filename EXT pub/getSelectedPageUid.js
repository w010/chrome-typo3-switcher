


// page uid in pagetree could be only find in page icon tooltip, so try to retrieve it from there

function getSelectedPageUid() {

  // typo v7.6 - v8.7
  var selectedPageTreeBranchIcon = document.querySelector('#typo3-pagetree .x-tree-selected .t3js-icon');
  //console.log( selectedPageTreeBranchIcon );

  var selectedPageTooltip = selectedPageTreeBranchIcon  &&
        selectedPageTreeBranchIcon.getAttribute('data-title');

  // typo v6.2
  if (!selectedPageTreeBranchIcon)  {
    selectedPageTreeBranchIcon = document.querySelector('#typo3-pagetree .x-tree-selected .t3-icon');
    console.info('typo3 v6.x or lower detected');
      selectedPageTooltip = selectedPageTreeBranchIcon  &&
          selectedPageTreeBranchIcon.getAttribute('qtip');
  }

  //console.log( selectedPage );

  // extract page uid from tooltip text
  selectedPageUid = (typeof selectedPageTooltip === 'string'
      ?  selectedPageTooltip.match(/id=([0-9])+/g, '').toString().replace('id=', '')   // it matches whole string. how to get only id with regexp in js?
      :  '0');

  console.info('selectedPageUid: ' + selectedPageUid);

  return selectedPageUid;
}



chrome.runtime.sendMessage({
  action: "selectedPageUid",
  source: getSelectedPageUid()
});

