


// page uid in pagetree could be only find in page icon tooltip, so try to retrieve it from there

function getSelectedPageUid() {

    let selectedPageUid = 0;

    // try to read t3 version - works for 8, 9, 10
    let typo3MajorBranch = 0;
    let typo3VersionNode = document.querySelector('.topbar-header-site-version');

    if (typo3VersionNode  &&  typeof typo3VersionNode.innerHTML === 'string')   {
        typo3MajorBranch = parseInt( typo3VersionNode.innerHTML.split('.')[0] );
    }


    // only way afaik is to read the svg rect overlay (in >=9) 
    // or parse tooltip/title text from current icon (in <=8)
    let selectedNode;
    let selectedPageInfo = '';
    let selectedPageTooltip = '';


    switch ( typo3MajorBranch ) {

        case 10:
        case 9:
            selectedNode = document.querySelector('.svg-tree-wrapper .node-selected');
            selectedPageInfo = selectedNode  &&
                selectedNode.getAttribute('data-state-id');
            selectedPageUid = (typeof selectedPageInfo === 'string')  &&
                parseInt( selectedPageInfo.split('_')[1] );
            
            console.info('typo3MajorBranch: ' + typo3MajorBranch);
            console.info('selectedPageUid: ' + selectedPageUid);
            return selectedPageUid;

        case 8:
        default:
            // typo v7.6 - v8.7 (but we can't include case 7 here) 
            selectedNode = document.querySelector('#typo3-pagetree .x-tree-selected .t3js-icon');
            selectedPageTooltip = selectedNode  &&
                selectedNode.getAttribute('data-title');
    }


    // this situation means branch 7 - pagetree is like in 8, but no version info in header (nor anywhere in be markup)
    if ( !typo3MajorBranch  &&  selectedNode)   {
        typo3MajorBranch = 7;
    }


    // if still nothing, it's branch 6 or older
    if (!selectedNode  &&  !typo3MajorBranch)  {
        selectedNode = document.querySelector('#typo3-pagetree .x-tree-selected .t3-icon');
        console.info('typo3 v6.x or lower detected');
        selectedPageTooltip = selectedNode  &&
            selectedNode.getAttribute('qtip');
    }


    // for 8, 7, 6 (maybe it works in 4, idk) extract page uid from tooltip text
    selectedPageUid = (typeof selectedPageTooltip === 'string'
        ? parseInt( selectedPageTooltip.match(/id=([0-9])+/g, '').toString().replace('id=', '') )  // it matches whole string. how to get only id with regexp in js?
        :  0);

    // console.log (selectedNode)
    // console.log (selectedPageUid)
    // console.log (selectedPageTooltip)
    console.info('typo3MajorBranch: ' + typo3MajorBranch);
    console.info('selectedPageUid: ' + selectedPageUid);
    //debugger

    return selectedPageUid;
}



chrome.runtime.sendMessage({
    action: "backend_getData",
    data: {
        selectedPageUid: getSelectedPageUid(),
    },
});

