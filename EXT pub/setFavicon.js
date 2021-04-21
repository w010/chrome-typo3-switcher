




var Favicon = {

    DEV : favicon_params.DEV,
    //lock : false,
    //runCounter : 0,


    setFavicon : function() {


        //Favicon.runCounter++;
        var params = favicon_params;

        if (Favicon.DEV) {
            console.group('FAVICO');
            //console.log('- from event: ' + params._debugEventTriggered);
            //console.log('- params:');
            console.log(params);
        }
        // return;

        // lock doesn't work as expected. for now it runs twice sometimes.
        /*if ( favicon_params._lock === true )    {
            console.log('### LOCKED, exit');
            console.groupEnd();
            return;
        }
        favicon_params._lock = true;*/

        // search current favicon, extract url and remove
        var faviconUrl = '';
        var linkElements = document.head.getElementsByTagName( 'link' );
        var linkElementFound;

        for( var i = 0;  i < linkElements.length;  i++ )  {
            //if ( linkElements[i].getAttribute( 'rel' ).match( /^(shortcut )?icon$/i ) )    {
            // for now look only for "shortcut icon" old style favicon and remove all others
            // later should be tested if it works properly with "icon" and pngs
            // (check if it helps if prepend to head instead of append)
            if ( linkElements[i].getAttribute( 'rel' ).match( /^shortcut icon$/i ) )    {
                faviconUrl = linkElements[i].href;

                if ( linkElements[i].getAttribute( 'author' ) === 'chromeTYPO3switcher' ) {
                    if (Favicon.DEV)    {
                        console.log('-- OUR FAVICON FOUND, EXIT');
                        console.groupEnd();
                    }
                    return;
                }
                // store if found
                linkElementFound = linkElements[i];
                // document.head.removeChild( linkElements[i] );

            }
            // remove all other icons - they are problematic / browser shows some of them
            if ( linkElements[i].getAttribute( 'rel' ).match( /^icon|apple-touch-icon$/i ) )    {
                document.head.removeChild( linkElements[i] );
            }
        }


        if (Favicon.DEV)    console.log('favicon url: ' + faviconUrl);

        if ( !faviconUrl )  {
            if (Favicon.DEV) {
                console.log('-- favicon NOT FOUND, use blank');
                //console.groupEnd();
            }
            
            // generate blank universal favicon image
            faviconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkY4MThEODM3ODgyMTFFODk1RURGMUVCMTJBNjEzQkQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkY4MThEODQ3ODgyMTFFODk1RURGMUVCMTJBNjEzQkQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRjgxOEQ4MTc4ODIxMUU4OTVFREYxRUIxMkE2MTNCRCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRjgxOEQ4Mjc4ODIxMUU4OTVFREYxRUIxMkE2MTNCRCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PheInx8AAAJESURBVHja7JtPSxtBGId3TIytJErSKiIe+gXSg3jRawVBSnroUU8SpEd7809v/TylJn4GhfaYQqGCaGgOpdm2IGKS2uz2tzILQ0C7k3Q2u9nfwMO+Cxl299l3Z99ZMsJ1XSvJbcxKeEu8gLRuB8dx/DAFpkM4x586PxZC3GJEQLvdtmzb9g7wCrvb4EkIAj6CDfAjyM3JZrNWPp83I8AbMHGQNxDwNsQsXQNVUPqXBE+A7qCu+wh4d3xfxg1wCP4YuOgieKbsrwSVYHoMeAoeyngHvDN01zelgC64AQ8UCS+APay3wLgSfzOY9pN+VoMyOFMyoQIeD0uAO8gbpI/mCT8G6+Brj4RHSakDpsApeN4jofo/JMSpEKqZkBC3StCX0FAkHA0iIY6lcE2OCb6E5UEyIa5zgU89Evp+HOIg4PIeCctyq0qYNToZGkI7AN/vmp7IGqGoSNgDr+MuIKXEZc2+c6OQAV7xcw5mgs6CZfUodOcmURVQk/OOrEbFeAIWjH8QCbFdSYK2vmalo/JJLCPTP7ECElMKUwAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUEC4AqK03s5VzkckMQO8RRV9/d9Jt9OFEu+CCfA7AgJWwbyMv+h0FDqLjFqt1liz2XwvhChFMQ0cx7FzudxSoVCom3oEHAjbAhXgxVaE+AwBL7GtG8uAbrdrdTodf2HiohXOusEg7Rf4gGu5TqfTViaTMSOAr0EKGL32V4ABANUr/m3+kFrxAAAAAElFTkSuQmCC';

            linkElementFound = document.createElement('link');
            linkElementFound.rel = 'icon'; 
            linkElementFound.type = 'image/x-icon'; 
            linkElementFound.href = faviconUrl;
            document.getElementsByTagName('head')[0].appendChild(linkElementFound);
        }

        var originalIconImageObject = new Image();
        originalIconImageObject.src = faviconUrl;
        originalIconImageObject.crossOrigin = "Anonymous";

        originalIconImageObject.onload = function() {

            var canvas = Favicon.renderFaviconWithOverlay( originalIconImageObject, params );

            // make new favicon element
            /*var newFavicon = document.createElement( 'link' );
            newFavicon.setAttribute( 'rel', 'shortcut icon' );
            newFavicon.setAttribute( 'author', 'chromeTYPO3switcher' );
            newFavicon.type = 'image/x-icon';
            newFavicon.href = canvas.toDataURL();
            // remove old favicon
            document.head.removeChild( linkElementFound );
            // put the new one into head
            document.head.appendChild( newFavicon );*/

            // change url in original element
            linkElementFound.href = canvas.toDataURL();
            linkElementFound.setAttribute( 'author', 'chromeTYPO3switcher' );

            // favicon_params._lock = false;

            if (Favicon.DEV)    {
                //console.log(newFavicon, 'newFavicon');
                console.log('DONE! ===================================================');
                console.groupEnd();
            }
        }
    },


    /**
     *
     * @param originalIconImageObject - Image object with current favicon
     * @param params - array with configuration: fill, position, alpha, composite, contextColor
     * @returns canvas object
     */
    renderFaviconWithOverlay : function ( originalIconImageObject, params ) {

        // put original icon onto canvas
        var canvas = document.createElement( 'canvas' );
        canvas.width = originalIconImageObject.width;
        canvas.height = originalIconImageObject.height;
        // get canvas 2d drawing context
        var context = canvas.getContext( '2d' );
        context.drawImage( originalIconImageObject, 0, 0 );
        context.fillStyle = params.contextColor;

        if (Favicon.DEV)    {
            console.log(params);
            //console.log(canvas);
            //console.log(context);
            console.log('favicon / canvas size: ' + originalIconImageObject.width + 'x' + originalIconImageObject.height);
        }

        // var position = 'bottom';
        // var fillShapeCoverRatio = 0.6;
        // context.globalAlpha = 0.75;
        // context.globalCompositeOperation = 'source-over';    // source-over (default), source-in, source-atop, destination-over, xor
        var fillShapeCoverRatio = params.fill;
        var position = params.position;

        context.globalAlpha = params.alpha;
        context.globalCompositeOperation = params.composite;


        switch (position)   {
            case 'left':
                context.fillRect(
                    0,
                    0,
                    Math.floor( canvas.width - canvas.width * (1 - fillShapeCoverRatio) ),
                    canvas.height   );
                break;

            case 'right':
                context.fillRect(
                    Math.floor( canvas.width * (1 - fillShapeCoverRatio) ),
                    0,
                    canvas.width,
                    canvas.height   );
                break;

            case 'top':
                context.fillRect(
                    0,
                    0,
                    canvas.width,
                    Math.floor( canvas.height - canvas.height * (1 - fillShapeCoverRatio) )   );
                break;

            case 'bottom':
            default:
                context.fillRect(
                    0,
                    Math.floor( canvas.height * (1 - fillShapeCoverRatio) ),
                    canvas.width,
                    canvas.height   );
                break;

            case 'bottom-left':
                // triangle drawn from its top-left angle
                context.beginPath();
                context.moveTo( 0,      Math.floor( canvas.height * (1 - fillShapeCoverRatio) ) );
                context.lineTo( Math.floor( canvas.width - canvas.width * (1 - fillShapeCoverRatio) ),      canvas.height );
                context.lineTo( 0,      canvas.height );
                context.fill();
                break;

            case 'bottom-right':
                // triangle drawn from its top-right angle
                context.beginPath();
                context.moveTo( canvas.width,       Math.floor( canvas.height * (1 - fillShapeCoverRatio) ) );
                context.lineTo( canvas.width,       canvas.height );
                context.lineTo( Math.floor( canvas.width * (1 - fillShapeCoverRatio) ),      canvas.width );
                context.fill();
                break;

            case 'top-left':
                // triangle drawn from its bottom-left angle
                context.beginPath();
                context.moveTo( 0,      Math.floor( canvas.height * fillShapeCoverRatio) );
                context.lineTo( 0,      0 );
                context.lineTo( Math.floor( canvas.width * (fillShapeCoverRatio) ),      0 );
                context.fill();
                break;

            case 'top-right':
                // triangle drawn from its bottom-right angle
                // debugger;
                context.beginPath();
                context.moveTo( canvas.width,      Math.floor( canvas.height * fillShapeCoverRatio) );
                context.lineTo( Math.floor( canvas.width * (1 - fillShapeCoverRatio) ),       0 );
                context.lineTo( canvas.width,       0 );
                context.fill();
                break;
        }

        return canvas;
    }
};



if ( typeof favicon_params !== 'undefined' ) {
    if (favicon_params.DEV) {
        console.log('* TYPO3 Switcher: set FAVICON / setFavicon.js successfully injected');
    }
    // this runs also in options preview. for now doesn't look like a problem, but in future it may check in params if should autorun
    Favicon.setFavicon();
}
