

console.log("- Handy Switcher: inject PRESELECT script into backend");
document.querySelector('body').className = 'SWITCHER__INJECTED_backend_preselect';


// onDOMContentLoaded = (function(){
let onloadeddata = (function(){

    // WIP, not yet ready
    return;

    console.log("DOM loaded!");

    // todo later: detect typo3 version


    setTimeout(() => {

        // trigger click on Page module

        let iconModulePage = document.querySelectorAll("#web_layout a");
        
        if ( !iconModulePage.length )   {
            // try TV instead
            iconModulePage = document.querySelectorAll("#web_txtemplavoilaplusLayout a");
        }
        
        if ( typeof iconModulePage[0] === 'undefined' )    {
            console.log('Cannot find Page module to open. Exit');
            return;
        }

        console.log('Open page module');
        iconModulePage[0].click();
        
        
        // todo: go further only if pagetree/filter was loaded
        


        // trigger click on filter button in pagetree
        // problem: menu is not there from the beginning, like in older. it generates on first use. try to workaround
        setTimeout(() => {
            
            let buttonFilter = document.querySelectorAll("#typo3-pagetree-topPanel-button-filter button");
            if ( typeof buttonFilter[0] === 'undefined' )    {
                console.log('Cannot find element #typo3-pagetree-topPanel-button-filter button. Exit');
                // return;
            }
            buttonFilter[0].click();

            console.log('Open pagetree filter');
            let inputFilter = document.getElementById("typo3-pagetree-topPanel-filter");

            if ( typeof inputFilter !== 'undefined' ) {
                
                inputFilter.value = '40';   
                // todo: read from message
                
                // todo: don't do anything if no message

                // submit filter - dispatch keypress event
                let event = new KeyboardEvent('keydown', {
                    type: 'keydown',
                    which: 13,
                });

                inputFilter.dispatchEvent(event);
                console.log('trigger filter submit');
                

                // todo: trigger click in pagetree result jesli ma taki uid dokladnie jak wpisany (bo czasem znajduje liczby w tytulach i to byloby bez sensu - 
                // zeby to mialo rece i nogi to preselekcja nie moze zaznaczac przypadkowych stron tylko dlatego, ze filter cos znalazl. musi zaznaczac dany pid koniecznie.
            }
                
        }, 1000);

            
    });
    
})();


// onload = (function(){ console.log("Page fully loaded!") })();
// onloadeddata = (function(){ console.log("Data loaded!") })();
