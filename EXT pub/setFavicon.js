

if (favicon_params  &&  favicon_params.DEV)         console.log('TYPO3 Switcher: setFavicon.js successfully injected');



var Favicon = {

    DEV: favicon_params.DEV,


    setFavicon : function() {

        if (Favicon.DEV)    console.log('favicon from event: ' + favicon_params._debugEventTriggered);

        /*if ( document.getElementsByClassName( 'chrome-typo3switcher-badge' ).length > 0 )
            return;*/

        var params = favicon_params;

        if (Favicon.DEV) {
            console.log('TYPO3 Switcher - SET FAVICON with params:');
            console.log(params);
        }

        /*var scale = typeof params.scale === "number"  ?  params.scale  :  1;
        var badgeContainer = document.createElement( 'div' );

        badgeContainer.innerHTML = '<b>' + params.contextLabel + '</b>';
        if ( typeof params.projectLabelDisplay === 'undefined'  ||  params.projectLabelDisplay === true )
            badgeContainer.innerHTML = params.projectLabel + '<br>' + badgeContainer.innerHTML;

        badgeContainer.classList.add( 'chrome-typo3switcher-badge' );*/


            // Find an existing favicon to use as the URL.
            favIconUrl = '';
            links = document.head.getElementsByTagName('link');

            for ( var i = 0;  i < links.length;  i++ )  {
                if ( links[i].getAttribute('rel').match(/^(shortcut )?icon$/i) )    {
                    favIconUrl = links[i].href;
                    if (links[i].getAttribute('author') === 't3switcher') {
                        if (Favicon.DEV)    console.log('OUR FAVICON FOUND, EXIT');
                        return;
                    }
                    document.head.removeChild(links[i]);
                }
            }
        if (Favicon.DEV)    console.log(favIconUrl);

            if ( !favIconUrl )
                return;

            var holder = new Image();
            holder.src = favIconUrl;

            holder.onload = function() {

                if (Favicon.DEV)    console.log(holder.width);
                if (Favicon.DEV)    console.log(holder.height);
                // Transpose the icon into a canvas.
                var canvas = document.createElement('canvas');
                canvas.width = holder.width;
                canvas.height = holder.height;
                if (Favicon.DEV)    console.log(canvas);
                var context = canvas.getContext('2d');
                context.drawImage(holder, 0, 0);
                context.fillStyle = params.contextColor;

                // context.globalCompositeOperation = "source-in";
                // context.fillRect(0, 0, canvas.width, canvas.height);

                // context.globalAlpha = 0.5;
                // context.fillRect(0, 0, canvas.width, canvas.height);

                context.fillRect(0, Math.floor(canvas.height * 0.75), canvas.width, Math.floor(canvas.height / 4));

                if (Favicon.DEV)    console.log(context);


                // Create a new favicon link.
                var favicon = document.createElement("link");
                favicon.setAttribute("rel", "icon");
                favicon.type = "image/x-icon";
                favicon.href = canvas.toDataURL();
                favicon.setAttribute('author', 't3switcher');
                //favicon.href = 'https://ssl.gstatic.com/keep/keep.ico';
                if (Favicon.DEV)console.log(favicon);
                if (Favicon.DEV)console.log(favicon.href);
                // Append the new favicon.
                document.head.appendChild(favicon);
                if (Favicon.DEV)console.log('===================================================');
            }
    }
};



Favicon.setFavicon();

/*
switch (ext.orientation) {
    case 'right':
        context.fillRect(Math.floor(canvas.width * 0.75), 0, Math.floor(canvas.width / 4), canvas.height);
        break;
    case 'bottom':
        context.fillRect(0, Math.floor(canvas.height * 0.75), canvas.width, Math.floor(canvas.height / 4));
        break;
    case 'left':
        context.fillRect(0, 0, Math.floor(canvas.width / 4), canvas.height);
        break;
    case 'cover':
        context.globalAlpha = 0.5;
        context.fillRect(0, 0, canvas.width, canvas.height);
        break;
    case 'replace':
        context.globalCompositeOperation = "source-in";
        context.fillRect(0, 0, canvas.width, canvas.height);
        break;
    case 'background':
        context.globalCompositeOperation = "destination-over";
        context.fillRect(0, 0, canvas.width, canvas.height);
        break;
    case 'xor-top':
        context.globalCompositeOperation = "xor";
        context.fillRect(0, 0, canvas.width, Math.floor(canvas.height / 4));
        break;
    default:
        context.fillRect(0, 0, canvas.width, Math.floor(canvas.height / 4));
        break;
}*/

/*
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    var links,
        i;

    if (!message.favIconUrl) {
        // Set a default to pass back.
        var favIconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gEVFSYuu6K2kgAAAMxJREFUOMu9UssOgjAQnK0PYvw35M4Nvwmu6IJ8oikm7HpQkFIeQRMn2WS3mU5mugV+BLVNURQ6RYrj+AjAvvkbY8zDIzGzWmu9yrJMmVlF5CAiOxHZ9e+ZthF5GbC27qpFGJ7AXNwBNAB0VEBVZ7NGUYTrlZt+bADYfhwIAAIReU9UVbfuJM8vj77IdslBkpyduSxLzDhwUde1MwdB4PEcASLASTDcOWFeYPA1RjEUMHMRVgksrXGK50UgWudgsEbCfh9860CRphn+jifEvoLrs8T+3wAAAABJRU5ErkJggg==';



        // Send either the URL or the default.
        sendResponse({'favIconUrl': favIconUrl});
    }*/
