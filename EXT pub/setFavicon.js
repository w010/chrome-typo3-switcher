




let Favicon = {

    DEV: false,
    DEBUG: 0,


    setFavicon: function(params) {

        if ( typeof params === 'undefined' )  {
            return console.warn('Handy Switcher: Favicon replace - no params given - exiting');
        }

        Favicon.DEV = params.DEV ?? false;
        Favicon.DEBUG = params.DEBUG ?? 0;


        if ( Favicon.DEV  &&  Favicon.DEBUG > 0) {
            console.groupCollapsed('Switcher: FAVICON');
            console.log('- from event: ' + params?._debugEventTriggered);
            console.log('- params:', params);
        }

        // search current favicon, extract url and remove
        let faviconUrl = '',
            linkElements = document.head.querySelectorAll( 'link' ),
            linkElementFound = false,
            newFavicon;


        linkElements.forEach(function(linkItem) {

            // (check if it helps if prepend to head instead of append)
            if ( linkItem.getAttribute( 'rel' ).match( /^(shortcut )?icon$/im ) )    {

                if ( linkItem.getAttribute( 'author' ) === 'chromeTYPO3switcher' ) {
                    if (Favicon.DEV)    {
                        console.log('-- OUR FAVICON FOUND, EXIT');
                        console.groupEnd();
                    }
                    return;
                }

                // store url if found
                faviconUrl = linkItem.href;
                linkElementFound = true;

                let replacement = document.createComment('(Switcher: favicon removed: rel='+linkItem.rel+' href='+linkItem.href+')');
                linkItem.after(replacement);
                // document.head.removeChild( linkElements[i] );
                linkItem.replaceWith(replacement);
            }

            // remove all other icons - they are problematic / browser shows some of them
            else if ( linkItem.getAttribute( 'rel' ).match( /^icon|apple-touch-icon$/i ) )    {
                document.head.removeChild( linkItem );
            }
        });


        if ( Favicon.DEV  &&  Favicon.DEBUG > 2 )
            console.log('favicon url: ' + faviconUrl);

        if ( !faviconUrl  ||  !linkElementFound )  {
            if (Favicon.DEV) {
                console.info('-- favicon NOT FOUND, use blank');
            }

            // generate blank universal favicon image
            faviconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkY4MThEODM3ODgyMTFFODk1RURGMUVCMTJBNjEzQkQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkY4MThEODQ3ODgyMTFFODk1RURGMUVCMTJBNjEzQkQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRjgxOEQ4MTc4ODIxMUU4OTVFREYxRUIxMkE2MTNCRCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRjgxOEQ4Mjc4ODIxMUU4OTVFREYxRUIxMkE2MTNCRCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PheInx8AAAJESURBVHja7JtPSxtBGId3TIytJErSKiIe+gXSg3jRawVBSnroUU8SpEd7809v/TylJn4GhfaYQqGCaGgOpdm2IGKS2uz2tzILQ0C7k3Q2u9nfwMO+Cxl299l3Z99ZMsJ1XSvJbcxKeEu8gLRuB8dx/DAFpkM4x586PxZC3GJEQLvdtmzb9g7wCrvb4EkIAj6CDfAjyM3JZrNWPp83I8AbMHGQNxDwNsQsXQNVUPqXBE+A7qCu+wh4d3xfxg1wCP4YuOgieKbsrwSVYHoMeAoeyngHvDN01zelgC64AQ8UCS+APay3wLgSfzOY9pN+VoMyOFMyoQIeD0uAO8gbpI/mCT8G6+Brj4RHSakDpsApeN4jofo/JMSpEKqZkBC3StCX0FAkHA0iIY6lcE2OCb6E5UEyIa5zgU89Evp+HOIg4PIeCctyq0qYNToZGkI7AN/vmp7IGqGoSNgDr+MuIKXEZc2+c6OQAV7xcw5mgs6CZfUodOcmURVQk/OOrEbFeAIWjH8QCbFdSYK2vmalo/JJLCPTP7ECElMKUwAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUAAFUEC4AqK03s5VzkckMQO8RRV9/d9Jt9OFEu+CCfA7AgJWwbyMv+h0FDqLjFqt1liz2XwvhChFMQ0cx7FzudxSoVCom3oEHAjbAhXgxVaE+AwBL7GtG8uAbrdrdTodf2HiohXOusEg7Rf4gGu5TqfTViaTMSOAr0EKGL32V4ABANUr/m3+kFrxAAAAAElFTkSuQmCC';

        }

        // make new favicon element
        newFavicon = document.createElement('link');
        // newFavicon.rel = 'icon'; 
        newFavicon.rel = 'shortcut icon'; 
        newFavicon.type = 'image/x-icon';
        // newFavicon.type = 'image/png'; 
        newFavicon.href = faviconUrl;
        newFavicon.setAttribute( 'author', 'chromeTYPO3switcher' );
        document.getElementsByTagName('head')[0].appendChild(newFavicon);

        let originalIconImageObject = new Image();
        originalIconImageObject.src = faviconUrl;
        originalIconImageObject.crossOrigin = "Anonymous";

        originalIconImageObject.onload = function() {

            let canvas = Favicon.renderFaviconWithOverlay( originalIconImageObject, params );

            // set href in our brand new icon element
            newFavicon.href = canvas.toDataURL();

            // change url in original elements
            let faviconLinks = document.querySelectorAll('link[rel*="icon"]');
            faviconLinks.forEach(function(favico) {
                favico.href = canvas.toDataURL();
            });

            if (Favicon.DEV)    {
                if ( Favicon.DEBUG > 2 ) {
                    console.log('* TYPO3 Switcher: set FAVICON / setFavicon.js successfully replaced');
                }
                console.log('DONE!');
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
    renderFaviconWithOverlay: function ( originalIconImageObject, params ) {

        // put original icon onto canvas
        let canvas = document.createElement( 'canvas' );
        canvas.width = originalIconImageObject.width;
        canvas.height = originalIconImageObject.height;
        // get canvas 2d drawing context
        let context = canvas.getContext( '2d' );
        context.drawImage( originalIconImageObject, 0, 0 );
        context.fillStyle = params.contextColor;

        if ( Favicon.DEV && Favicon.DEBUG > 1)    {
            //console.log(canvas);
            //console.log(context);
            console.log('favicon / canvas size: ' + originalIconImageObject.width + 'x' + originalIconImageObject.height);
        }

        // var position = 'bottom';
        // var fillShapeCoverRatio = 0.6;
        // context.globalAlpha = 0.75;
        // context.globalCompositeOperation = 'source-over';    // source-over (default), source-in, source-atop, destination-over, xor
        let fillShapeCoverRatio = params.fill;
        let position = params.position;

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


// this runs also in options preview. for now doesn't look like a problem, but in future it may check in params if should autorun


if ( typeof favicon_params !== 'undefined' )    {
    
    if ( document.readyState === 'complete' ) {
        Favicon.setFavicon( favicon_params );
    }
    else {
        document.addEventListener("DOMContentLoaded", function(event) {
            Favicon.setFavicon( favicon_params );
        });
    }
}
