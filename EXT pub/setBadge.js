

if (badge_params  &&  badge_params.DEV)         console.log('TYPO3 Switcher: setBadge.js successfully injected');



var Badge = {

    DEV: badge_params.DEV,


    setBadge : function() {

        if ( document.getElementsByClassName('chrome-typo3switcher-badge').length > 0 )
            return;

        var params = badge_params;

        console.log(params);

        var div = document.createElement('div');
        div.innerHTML = params.projectLabel + '<br><b>' + params.contextLabel + '</b>';
        div.classList.add( 'chrome-typo3switcher-badge' );
        // div.style.backgroundColor = params.contextColor;
        Badge.css( div, {
            position: 'fixed',
            zIndex: '9999999',
            top: '16px',
            left: '-48px',
            padding: '5px 50px',
            transform: 'rotate(-45deg)',
            backgroundColor: params.contextColor,
            textAlign: 'center',
            fontFamily: 'Arial, Tahoma, Verdana',
            color: '#000',
            opacity: '.85',
            cursor: 'normal',
            pointerEvents: 'none'
        });
        document.getElementsByTagName('body')[0].appendChild( div );
    },


    css : function( el, style)    {
        for (var prop in style) {
            el.style[prop] = style[prop];
        }
    }
};



Badge.setBadge();

