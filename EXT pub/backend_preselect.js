

console.log('-------------- PRESELECT!');
console.log("- Handy Switcher: execute PRESELECT script in the tab with backend");
document.querySelector('body').classList.add('SWITCHER__EXECUTED_backend_preselect');


if (typeof Preselect === 'undefined')  {

  var Preselect = {

    DEV: false,
    DEBUG: 0,

    typo3MajorVersion: 0,

    /**
     * Try to read or estimate TYPO3 version - works for 8, 9, 10, 11
     * @return {number}
     */
    getTypo3MajorVersion: function() {

        let typo3MajorVersion = 0;
        let typo3VersionNode = document.querySelector('.topbar-header-site-version');
    
        if (typo3VersionNode  &&  typeof typo3VersionNode.innerHTML === 'string')   {
            typo3MajorVersion = parseInt( typo3VersionNode.innerHTML.split('.')[0] );
        }
console.log(typo3MajorVersion);
        return typo3MajorVersion;
    },




    /**
     * Find page with incoming pid, crawl & expand pagetree (or use its native search) 
     */
    findPidInPageTree: function(params) {

        Preselect.DEV = params.DEV ?? false;
        Preselect.DEBUG = params.DEBUG ?? 0;
        let pageUid = params?.pageUid;

        if ( typeof params === 'undefined'  ||  !pageUid )  {
            return console.warn('Handy Switcher: findPidInPageTree - no params given - exiting');
        }

        // start with some delay, in case we can't count on status/listener. review later after tests 
        setTimeout(() => {

            let T3VER = Preselect.typo3MajorVersion = Preselect.getTypo3MajorVersion();
            console.log(T3VER);

            // First: open the Page module - trigger click on menu icon.

            if (Preselect.DEV && Preselect.DEBUG > 0)
                console.log('- Open module Page');

            // Before v9 [confirm] markup was a bit different  
            let buttonModulePage = document.querySelectorAll("#web_layout" + (T3VER < 9 ? ' a' : '') );
            // If not found, try the Templavoila's instead.
            if ( !buttonModulePage.length )
                buttonModulePage = document.querySelectorAll("#web_txtemplavoilaplusLayout" + (T3VER < 9 ? ' a' : ''));
            // If still nothing, better luck next time
            if ( !buttonModulePage.length )    {
                return console.log('Cannot find Page module to open. Exit');
            }

            buttonModulePage[0].click();

            // ...And then: expand the pagetree and focus requested page
            // Problem: menu is not there from the beginning, like in older. it generates on first use. try to work this around somehow
            // todo: continue only if pagetree/filter is loaded
            // - For now temporarily use simple delay. find out how we can check this, or use some of listeners
            setTimeout(() => {


                /*  Now we have 3 ways:
                  1. Locate the page in tree (query selector, or crawl the tree's dom, if not possible)
                        [crawling might be slow maybe on bigger sites. not sure if in 10 is even still possible,
                         tree's markup is weird there and lacks params that helped earlier. - todo: confirm/describe details ]
                         [todo: some code for this exists in backend_getData, test and reuse]                                                                      
                  2. Use the pagetree filter/search.
                        [a bit unpredictable, we can't narrow matching only to pid values, also matches titles with numbers]
                  3. Try to manipulate and do some hacks on Backend's js and dom.
                        [not very easy or always possible, but worth try, if it can do this natively it's the most sure 
                         - at least while it works.]
                 Todo: handle subsite trees [what with domains?] */

                
                
                //
                // The built-in FILTER (Method 2):
                // +
                // The native-tree-use (Method 1)
                // (only combined mode makes sense - pagetree is not loaded as whole on page load, it lazy loads with ajax.
                // So we must have tree filtered first to find and activate the page itself in the tree
                //


                // - trigger click on pagetree's filter button
                if (T3VER >= 9)  {  // todo: check if it changed in 9 or in 10

                    Preselect.filterPageTree( pageUid );
                    Preselect.selectPageInTree( pageUid );
                }

                // todo: check and confirm, this probably worked in 7 or 8
                else if (T3VER <= 8)  {
                    let buttonFilter = document.querySelectorAll("#typo3-pagetree-topPanel-button-filter button");
                    if ( typeof buttonFilter[0] === 'undefined' )    {
                        return console.log('Cannot find element #typo3-pagetree-topPanel-button-filter button. Exit');
                    }
                    buttonFilter[0].click();
    
                    console.log('Open pagetree filter');
                    let inputFilter = document.getElementById("typo3-pagetree-topPanel-filter");
    
                    if ( typeof inputFilter !== 'undefined' ) {
                        
                        inputFilter.value = pageUid;   
                        
                        // todo: don't do anything if no message
    
                        // submit filter - dispatch keypress event
                        let event = new KeyboardEvent('keydown', {
                            type: 'keydown',
                            which: 13,
                        });
    
                        inputFilter.dispatchEvent(event);
                        console.log('trigger filter submit');
                    }
                }

            }, 500);

        });
    },

    /**
     * Trigger pagetree filter, inserting our value before
     * @param pageUid
     */
    filterPageTree: function(pageUid)    {
        pageUid = String(pageUid);

// jquery version. todo: try to run natively
        // doesn't work

        // console.log( $('#typo3-pagetree-tree') );
        // console.log( $('#typo3-pagetree-tree').data('svgtree') );
        console.log( $('#typo3-pagetree-tree').data() );
        console.log( $('#typo3-pagetree-tree').data('svgtree') );
        
        $('.search-input').val(pageUid);
        // $('#typo3-pagetree-tree').data('svgtree').searchQuery = pageUid;
        // $('#typo3-pagetree-tree').data('svgtree').refreshOrFilterTree();
        // $('#typo3-pagetree-tree').data('svgtree').prepareDataForVisibleNodes();
        // $('#typo3-pagetree-tree').data('svgtree').update();
        return;
        
    
        document.querySelector('button[data-tree-icon="actions-filter"]').dispatchEvent(new MouseEvent('click', {view: window, bubbles: true, cancelable: true}));
        
        pageUid = parseInt( pageUid );
        document.querySelector('.search-input').value = pageUid;
        console.log(document.querySelector('#typo3-pagetree-tree'));
        console.log(document.querySelector('#typo3-pagetree-tree').dataset);
        
        
        // todo next: call this with raw JS - to trigger search and expand the tree with target page included

        //console.log(document.querySelector('#typo3-pagetree-tree').getRootNode);
        
        //console.log(window.$('#typo3-pagetree-tree').data('svgtree'));
        // document.querySelector('#typo3-pagetree-tree').dataset.svgtree.searchQuery = pageUid;
        // document.querySelector('#typo3-pagetree-tree').dataset.svgtree.refreshOrFilterTree();
        // document.querySelector('#typo3-pagetree-tree').dataset.svgtree.prepareDataForVisibleNodes();
        // document.querySelector('#typo3-pagetree-tree').dataset.svgtree.update();
    },


    /**
     * 
     * @param pageUid
     */
    selectPageInTree: function(pageUid)    {
        pageUid = parseInt( pageUid );
        console.log(document.querySelector('#typo3-pagetree-tree'));
        
        
        let triggerClick = (selector) => {
            if (document.querySelector(selector))
                document.querySelector(selector).dispatchEvent(new MouseEvent('click', {view: window, bubbles: true, cancelable: true}));
        };
        
        triggerClick('#identifier-0_'+pageUid);
        triggerClick('[data-state-id="0_'+pageUid+'"]');
    },
    
  }
}


console.log('* TYPO3 Switcher: page preselect js successfully injected');

// debugger

if ( typeof pagepreselect_params !== 'undefined' ) {

    console.log(Preselect.typo3MajorVersion());
    console.log('pagepreselect_params', apagepreselect_params);


    /*if ( pagepreselect_params.DEV ) {
    }*/


    if ( Preselect.typo3MajorVersion() >= 11 ) {
        alert('11 !');
        console.log('pid: ' + Switcher._pageUid);
    }
    else if ( Preselect.getTypo3MajorVersion() >= 10 ) {
        // generate native backend path and redirect tab (from background)



        alert ( pagepreselect_params.backendUrl );

    }
    else    {
        alert ( 'fallback' );
        // fallback tricks
        Preselect.findPidInPageTree( pagepreselect_params );
    }
    
}



/*document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
});*/


/*function _preselect_docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}*/    

/*_preselect_docReady(function() {
    console.log('READY!!!!!!!!!!!');
    console.log(Preselect.getTypo3MajorVersion());
    //console.log(pagepreselect_params);
    debugger;
});*/


function transformPage()    {
    alert('xxx');
    console.log('YYY');
}


/*
// that works on 10:
    $('button[data-modulename=web_layout]').click();    // works also with # (id) - check and describe if the id is there in all versions? 

    // filter trigger (also example of hacking into some native functionality / at least calling some js)
    function reLoadTreeTYPO(string){
        string = String(string);
        $('.search-input').val(string);
        $('#typo3-pagetree-tree').data('svgtree').searchQuery = string;
        $('#typo3-pagetree-tree').data('svgtree').refreshOrFilterTree();
        $('#typo3-pagetree-tree').data('svgtree').prepareDataForVisibleNodes();
        $('#typo3-pagetree-tree').data('svgtree').update();
    }
    reLoadTreeTYPO('93');

    // this only sets value, doesn't trigger filter    
    $('button[data-tree-icon="actions-filter"]').click();
    $('[data-tree-submenu="filter"] .search-input').val( '1' );


    // click on page in tree:
    document.querySelector("#typo3-pagetree-tree > svg > g > g.nodes-bg > rect:nth-child(3)").dispatchEvent(new MouseEvent('click', {
        view: window, bubbles: true, cancelable: true
    }));

    or jq: 
    $('#typo3-pagetree-tree').data('svgtree').selectNode( $('#typo3-pagetree-tree').data('svgtree').nodes[1] )
*/