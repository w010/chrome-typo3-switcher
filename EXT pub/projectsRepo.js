/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2020
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Project repository script
 */





let RepoHelper = {

    DEV : true,
    options : {},

    
    fetchProjects : function(caller)  {

        // prepare placeholder for ajax data
        caller.find('.ajax-target').empty();
        caller.find('.ajax-target').addClass('ajax-loading');
        ExtOptions.ajaxAddLoaderImage( caller.find('.ajax-target') );

        // call for ajax data
        // https://forum.jquery.com/topic/ajax-get-prompting-for-credentials
        $.ajax({
            url: $('#repo_url').val(),
            data: {
                key: $('#repo_key').val(),
                action: 'fetch',
                filter: $('#repo_fetch_filter').val(),
            },
            dataType: 'json',
        })
            .done(function(data) {
                caller.find('.ajax-target').html(
                    '<p>Found items: <b>'+ data.result.length +'</b></p>' +
                    '<button class="btn getAll"><span class="icon"></span> <span class="text">Import all <abbr title="Only imports new, doesn\'t update these uuids which are found to already exist in config">missing</abbr></span></button>'
                );

                $('.dialog-fetch button.getAll').on('click', function(){
                    let importableItems = caller.find('.ajax-target button.get');
                    let importableItemsCount = importableItems.length;
                    // trigger all clean-importable items
                    importableItems.trigger('click');
                    $(this).replaceWith(
                        $('<p class="level-info">All clean-importable projects added. There was ' + importableItemsCount + ' such items.</p>')
                    );
                });

                if (data.success === true)  {
                    $.each( data.result, function (i, projectItem) {
                        let project = RepoHelper.buildProjectPreviewItem( projectItem );
                        project.appendTo( $( '.fetched-projects' ) );
                    });
                }
                else    {
                    caller.find('.ajax-target').html('<p class="level-error">Success = false, error: ' + data.error + '</p>');    
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                let message = errorThrown + ', status: ' + jqXHR.status;
                caller.find('.ajax-target').html('<p class="level-error">Ajax repo call failed: ' + message + '</p>');
            })
            .always(function() {
                caller.find('.ajax-target').removeClass('ajax-loading');
            });
    },
    
    
    /**
     * Insert project preview item block
     * @param projectItem object
     */
    buildProjectPreviewItem : function(projectItem)   {
        let projectPreview = $( '<div class="project-item-preview project-uuid--'+ projectItem.uuid +'">' +
                '<h3 class="name">'+ projectItem.name +'<span class="infoicon"></span></h3>' +
                '<div class="contexts"><p>Contexts:</p></div>' +
                '<div class="links"><p>Links:</p></div>' +
                '<div class="buttons">' +
                    '<button class="btn compare"><span class="icon"></span> <span class="text">Compare</span></button>' +
                    '<button class="btn add replace"><span class="icon"></span> <span class="text">Replace existing</span></button>' +
                    '<button class="btn add get"><span class="icon"></span> <span class="text">Import project</span></button>' +
                '</button>' +
            '</div>' );

        // populate data

        if ( typeof projectItem.contexts !== 'undefined' )  {
            $.each( projectItem.contexts, function (i, contextItem) {
                let context = $( '<div class="context-item">' +
                    '<span class="color"></span>' +
                    '<h4 class="name">'+ contextItem.name +'</h4>' +
                    '<div class="url"><a target="_blank" href="'+ contextItem.url +'">'+ contextItem.url +'</a></div>' +
                '</div>' );
                context.find( '.color' ).css('backgroundColor', contextItem.color);
                context.appendTo( projectPreview.find( '.contexts' ) );
            });
        }

        if ( typeof projectItem.links !== 'undefined' )  {
            $.each( projectItem.links, function (i, linkItem) {
                let link = $( '<div class="link-item">' +
                    '<h4 class="name">'+ linkItem.name +'</h4>' +
                    '<div class="url"><a target="_blank" href="'+ linkItem.url +'">'+ linkItem.url +'</a></div>' +
                '</div>' );
                link.appendTo( projectPreview.find( '.links' ) );
            });
        }


        // look in local items and mark these found existing
        if ( $('#project_'+projectItem.uuid ).length )   {
            projectPreview.addClass('local-exists');
            projectPreview.attr('title', 'Project item with this uuid exists. Use Compare button to check for any differences or Replace to update local item with this one');
            
            // try to estimate if the projects' data arrays (local & fetched) are differs or not 
            let projectExistingItem = ExtOptions.readProjectData( $('#project_'+projectItem.uuid) );
            delete projectExistingItem.hidden;  // don't compare that prop
            delete projectItem.hidden;

            let itemsArePrettyMuchIdentical = cyrb53( JSON.stringify(projectExistingItem) ) === cyrb53( JSON.stringify(projectItem) );
                // console.log(cyrb53( JSON.stringify(projectExistingItem) ));
                // console.log(projectExistingItem);
                // console.log(cyrb53( JSON.stringify(projectItem) ));
                // console.log(projectItem);

            if (itemsArePrettyMuchIdentical)    {
                projectPreview.addClass('identical');
            }
            else    {
                projectPreview.addClass('differs');
            }
        }
        
        // remove buttons unneeded in specified conditions (like: Add project on items which does exist - we must use Replace only)
        $(' .fetched-projects .local-exists button.get' ).remove();
        

        // bind button get/add to my projects
        projectPreview.find( 'button.get' ).click( function() {
			ExtOptions.insertProjectItem( projectItem );
            ExtOptions.optionsSave();
            
            // animate and remove that fetchlist preview item
            RepoHelper.animateAddProject( projectPreview )
        });


        // bind button replace existing
        projectPreview.find( 'button.replace' ).click( function() {
			ExtOptions.confirmDialog( 'Replace existing project with this one', 'Are you sure?', function() {
                // replace whole element where it is, to keep sorting
                // temporary change the id, because new one will conflict with the same. then insert new, then move it to replace the old one
				$('#project_' + projectItem.uuid).attr('id', 'project_' + projectItem.uuid + '_tobereplaced');

			    let newProjectNode = ExtOptions.insertProjectItem( projectItem );

			    $('#project_' + projectItem.uuid + '_tobereplaced')
                    .replaceWith( newProjectNode );
			    
			    ExtOptions.fillExportData();
			    ExtOptions.optionsSave();

			    // animate and remove clicked fetchlist preview item
                RepoHelper.animateAddProject( projectPreview )
            });
        });


        // bind button get/add to my projects
        projectPreview.find( 'button.compare' ).click( function() {
			RepoHelper.displayComparison( projectItem );
        });


        return projectPreview;
    },
    
    
    animateAddProject : function (project)  {
        // due to problems with clipping positioned element inside box with overflow-y scroll (hides also x but it shouldn't)
        // make the animation workaround
        // after positiong absolute it jumps to top of relative parent - to have it absolute but in the same place as before absolute 
        // - read that offset first and later set as top. + compensate by height of form controls above the list (could be measured, but let's say it's ok like that)  
        let initialPositionOffset = project.position().top + 56; 
        project.parent().parent()
            .prepend(project);
        project
            .css('position', 'absolute')
            .css('pointerEvents', 'none')   // mainly to deactivate buttons before it disappears
            .css('zIndex', '3')
            .css('width', '98%')
            .css('top', initialPositionOffset + 'px')
            .css('left', '0')
            .css('box-shadow', '10px 10px 20px -3px #666')
            .animate({
                left: [ '-=250', 'swing' ],
                top: [ '-=50', 'swing' ],
                opacity: 'toggle',
            }, {
                duration: 900,
                /*specialEasing: {
                    top: 'easeOutBounce',   // doesn't work without jq-ui
                },*/
                complete: function() {
                    project.remove();
                }
            });
    },
    
    
    displayComparison : function(projectPreviewItem) {

        let projectExistingItem = ExtOptions.readProjectData( $('#project_'+projectPreviewItem.uuid) );
        
        let content = $( '<div class="row">' +
                '<div class="col-6 compare-mine"><h1>Mine (existing)</h1></div>' +
                '<div class="col-6 compare-theirs"><h1>Theirs (fetched)</h1></div>' +
            '</div>' );

        
        delete projectExistingItem.hidden;  // don't compare that - unset for comparing
        delete projectPreviewItem.hidden;

        let projectPreviewItem_string = JSON.stringify(projectPreviewItem, null, 4);
        let projectExistingItem_string = JSON.stringify(projectExistingItem, null, 4);

      
        content.find( '.compare-mine' ).append('<div class="compare-diff">' +
                projectPreviewItem_string.diff( projectExistingItem_string ) +
            '</div>'
        );
        
        content.find( '.compare-theirs' ).append('<div class="compare-diff">' +
                projectExistingItem_string.diff( projectPreviewItem_string ) +
            '</div>'
        );


        // display as another container above modal (don't create new modal, it replaces current and we need it)
        let overdialog = $( '<div class="dialog dialog-independent dialog-compare">' );
        $( 'body' ).append( overdialog );

        $( '<div class="dialog-inner">' )
            .append( $( '<h2 class="dialog-head">' ).html( 'Compare config' ) )
            .append( $( '<span class="dialog-close" title="Close">' ).html( 'X' ).on('click', function(){
                $( 'body > .dialog-compare' ).remove();
                // restore fetch modal dim
                $('.dialog-fetch').css('opacity', '');
            }) )
            .append( $( '<div class="dialog-body">' ).html( content ) )
            .appendTo( overdialog );


        // dim the fetch dialog under
        $('.dialog-fetch').css('opacity', '0.5');

        // good idea is to disable here esc-key event - because pressing it when being in
        // comparison dialog closes all modals and you loose your fetch/search etc. better just do nothing, or try that: 
        // using this to keep modal to esc-close allows temporary disabling this handler
        ExtOptions.dialogToCloseOnGlobalEvents = $;
    },
};



/**
 * String diff helper / found online so don't ask me how it works
 */

Array.prototype.rotate = function (n) {
    var len = this.length;
    return !(n % len) ? this
        : n > 0 ? this.map((e, i, a) => a[(i + n) % len])
            : this.map((e, i, a) => a[(len - (len - i - n) % len) % len]);
};

String.prototype.diff = function (s) {

    var getBaseIndex = function (s, l) { // returns the index of first mismatching character
            var i = 0;
            while (s[i] === l[i] && i < s.length) ++i;
            return i;
        },

        findFirstChange = function (s, l) { // returns the first matching substring after base index
            var fi = len,
                substr = "",
                match = false,
                i = 0;
            while (!match && i < s.length) {
                s[i] !== l[i] ? ++i : match = !match;
            }
            match && (fi = i); // match starts from this index
            while (match && i < s.length) {
                s[i] === l[i] ? substr += s[i++] : match = !match;
            }
            return {
                bix: bi,    // base index : index of first mismaching character
                fis: fi,    // index of next re match in shorter string
                fil: fi,    // index of next re match in longer string (will be adjusted later)
                fss: substr // next matching substring after first mismatch
            };
        },

        isThisLonger = true; // true if the string designated by "this" is longer
    // debugger;
    bi = getBaseIndex(this, s),
        matchStr = s.slice(0, bi), // the matching portion at the beginning
        long = this.length >= s.length ? (isThisLonger = true, [...this].slice(bi)) // converted to array as the
            : (isThisLonger = false, [...s].slice(bi)),  // long string gets rotated 
        short = isThisLonger ? s.slice(bi) : this.slice(bi),
        len = long.length,
        substrings = [],
        cd = {}, // change data !! important
        change = [], // holds deleted and inserted substrings at indices 0 and 1
        nextThis = "", // remaining part of old string to feed recursive call
        nextS = "", // remaining part of new string to feed recursive call
        result = ""; // the glorious result

    for (var rc = 0; rc < len; rc++) { // rc -> rotate count
        cd = findFirstChange(short, long.rotate(rc)); // collect change indices
        cd.fil = rc < len - cd.fis ? cd.fil + rc : cd.fis + len - rc;   // adjusted for index of next re match in longer string
        substrings.push(cd);
    }
    cd = !!substrings.length && substrings.sort((a, b) => b.fss.length - a.fss.length || a.fis - b.fis || b.fil - a.fil)[0];
    long = long.join("");
    if (cd) {
        change = isThisLonger ? [long.slice(0, cd.fil), short.slice(0, cd.fis)]
            : [short.slice(0, cd.fis), long.slice(0, cd.fil)];
        nextThis = isThisLonger ? long.slice(cd.fil) : short.slice(cd.fis);
        nextS = isThisLonger ? short.slice(cd.fis) : long.slice(cd.fil);
        change[0] = change[0] && ('<span class = "deleted">' + change[0] + '</span>');
        change[1] = change[1] && ('<span class = "inserted">' + change[1] + '</span>');
        result = matchStr + change[0] + change[1];
    } else result = this;
    result += (nextThis !== "" || nextS !== "") ? nextThis.diff(nextS) : "";
    return result;
};
