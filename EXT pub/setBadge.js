

//if (badge_params  &&  badge_params.DEV)         console.log('TYPO3 Switcher: setBadge.js successfully injected');



var Badge = {

    DEV: badge_params.DEV,


    setBadge : function() {

        //console.log('badge from event: ' + badge_params._debugEventTriggered);

        if ( document.getElementsByClassName( 'chrome-typo3switcher-badge' ).length > 0 )
            return;

        var params = badge_params;

        if (Badge.DEV) {
            console.log('TYPO3 Switcher - SET BADGE with params:');
            console.log(params);
        }

        var scale = typeof params.scale === "number"  ?  params.scale  :  1;
        var badgeContainer = document.createElement( 'div' );

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
            lineHeight: 1.2 + 'em'
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
    },


    css : function( el, style)    {
        for (var prop in style) {
            el.style[prop] = style[prop];
        }
    }
};



Badge.setBadge();

