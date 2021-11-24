


// we can't use this, because preview in options won't work - it needs to be inserted there in other way than on normal page
if (typeof badge_params === 'undefined')  {
    let badge_params = {};
}

    let Badge = {

        DEV: false,
        DEBUG: 0,


        /**
         * Insert badge into dom
         * @param params object - configuration  
         */
        setBadge: function(params) {
            //console.log('badge from event: ' + params._debugEventTriggered);

            if ( typeof params === 'undefined' )  {
                return console.warn('Handy Switcher: Badge insert - no params given - exiting');
            }

            Badge.DEV = params.DEV ?? false;
            Badge.DEBUG = params.DEBUG ?? 0;

            // find and remove current badge, if exist. usually never fires, because setbadge runs only on page load (update) event. but may be needed for preview 
            let currentBadge = document.getElementsByClassName( 'chrome-typo3switcher-badge' )[0];

            if ( currentBadge )   {
                currentBadge.parentNode.removeChild(currentBadge);
            }

            if ( Badge.DEV  &&  Badge.DEBUG > 0 ) {
                console.groupCollapsed('Switcher: BADGE');
                console.log('- from event: ' + params?._debugEventTriggered);
                console.log('- params:', params);
            }

            let scale = typeof params.scale === "number"  ?  params.scale  :  1;
            let badgeContainer = document.createElement( 'div' );

            badgeContainer.innerHTML = '<b>' + params.contextLabel + '</b>';
            if ( typeof params.projectLabelDisplay === 'undefined'  ||  params.projectLabelDisplay === true )
                badgeContainer.innerHTML = params.projectLabel + '<br>' + badgeContainer.innerHTML;

            badgeContainer.classList.add( 'chrome-typo3switcher-badge' );
            Badge.css( badgeContainer, {
                position: 'fixed',
                zIndex: '9999999',
                padding: 5 * scale + 'px 0',
                width: 200 + 'px',
                overflow: 'hidden',
                backgroundColor: params.contextColor,
                textAlign: 'center',
                fontFamily: 'Arial, Tahoma, Verdana',
                color: '#000',
                opacity: '.85',
                cursor: 'normal',
                pointerEvents: 'none',
                fontSize: 12 * scale + 'px',
                lineHeight: 1.2 + 'em',
            });

            if ( params.position === 'right' )    {
                Badge.css(badgeContainer, {
                    top: '12px',
                    right: '-70px',
                    transform: 'rotate(45deg)'
                });
            }
            else {
                Badge.css(badgeContainer, {
                    top: '12px',
                    left: '-70px',
                    transform: 'rotate(-45deg)'
                });
            }
            document.getElementsByTagName( 'body' )[0].appendChild( badgeContainer );

            if ( Badge.DEV  &&  Badge.DEBUG > 2 ) {
                console.log('* Handy Switcher: set BADGE / setBadge.js successfully inserted');
            }
            console.log('DONE!');
            console.groupEnd();
        },


        css: function( el, style)    {
            for (let prop in style) {
                el.style[prop] = style[prop];
            }
        }
    }




    // Variable badge_params is defined in environment.js / background.js
    // That definition is executed on tab, so is readable here in global scope

    if ( typeof badge_params !== 'undefined' ) {
        Badge.setBadge( badge_params );
    }

//Badge = null;


