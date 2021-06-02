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



const minRepoVersionRequest = '0.2.0';    // repo performs auto-check and sends info about incomatibility or deprecation


let RepoHelper = {

    DEV : true,
    options : {},
    
    // store last auth level to control gui (don't rely on that, it's not a security control)
    authLevel : '',

    
    
    
    /**
     * Dialog about fetching projects from repo
     * @param title string
     * @param message string
     */
    repoDialog : function(title, message)   {
        
        // help info displayed if no repo url set
        let info_repo_default = '';

        if ( !ExtOptions.options.repo_url ) {
            info_repo_default = '<p><a id="repo_test" href="#">Test how it works using example dummy repo</a><br>' +
                'You can easily host your own project repo, <a class="external" href="https://wolo.pl/handyswitcher/projectrepo/" target="_blank">see details how</a>.</p>';
        }

        let content = 
            $( '<div class="repo-config">' +
                /*'<button class="btn connect" id="repo_handshake"><span class="icon"></span> <span class="text">Handshake repo</span></button>' +
                '<input type="text" id="repo_url" placeholder="URL of your repository">  <label>Key: <input type="text" id="repo_key"></label>' +
                '<button class="btn save" id="repo_config_save"><span class="icon"></span> </button>' +*/

                '<p class="repo-status">Access level: <span id="repo_auth_level" class="level-info">'+ RepoHelper.authLevel +'</span></p>' +
                '<div class="notice"></div>' +  // only color notice, no status box here
            '</div>' +
            '<div class="fetch-inner">' +
                info_repo_default +
                '<div class="fetch-controls">' +
                    '<input type="text" id="repo_fetch_filter" placeholder="Filter by name"> <button class="btn fetch" id="repo_fetch" disabled><span class="icon"></span> <span class="text">Fetch projects list</span></button>' +
                '</div>' +
                '<div class="message status"></div>' +
                '<div class="fetched-projects ajax-target"></div>' +
            '</div>'
        );


        ExtOptions.openDialog(title, content, 'dialog-fetch', function(caller)    {
            
            let $input_repo_url = $('#repo_url');
            let $input_repo_key = $('#repo_key');
 
            // set variables from storage, control fetch button de/activation
            $input_repo_url
                .on('change paste keyup', function(){
                    if ($(this).val()) {
                        $('#repo_fetch').attr('disabled', false);
                        $('#repo_handshake').attr('disabled', false);
                    }
                    else    {
                        $('#repo_fetch').attr('disabled', true);
                        $('#repo_handshake').attr('disabled', true);
                    }
                })
                .val( ExtOptions.options.repo_url )
                .trigger('change');
            $input_repo_key.val( ExtOptions.options.repo_key );
            
            // bind the handshake repo settings button
            content.find('#repo_handshake').on('click', function() {
                RepoHelper.ajaxRequest_handshake();
            });

            // bind fetch button
            content.find('#repo_fetch').on('click', function() {
                RepoHelper.ajaxRequest_fetchProjects(caller);
            });
            
            // bind save repo settings button
            content.find('#repo_config_save').on('click', function() {
                RepoHelper.saveRepoSettings();
            });
            
            // on enter key pressed in filter input
            content.find('#repo_fetch_filter').focus().on( 'keypress', function(e) {
                if ( e.which === 13 )       RepoHelper.ajaxRequest_fetchProjects(caller);
            })
    
            // bind additional test link
            content.find('#repo_test').on('click', function() {
                $('#repo_url')
                    .val('https://wolo.pl/handyswitcher/repoexample/')
                    .trigger('change');
                return false;
            });
        });
    },

    
    /**
     * Dialog about resolving Project conflict on push/pull
     * @param title string
     * @param message string
     * @param projectItem_mine
     * @param projectItem_their
     */
    conflictDialog : function(title, message, projectItem_mine, projectItem_their)   {

        let content = 
            $( '<div class="conflict-resolve">' +
                '<button class="btn fetch" id="conflict_localmerge_mine"><span class="icon"></span> <span class="text"><abbr title="Pull the remote one, merge them together and edit locally to push later">Manual merge</abbr> (MINE priority)</span></button>' +
                '<button class="btn fetch" id="conflict_localmerge_their"><span class="icon"></span> <span class="text"><abbr title="Pull the remote one, merge them together and edit locally to push later">Manual merge</abbr> (THEIR priority)</span></button>' +
                '<button class="btn confirm-warn replace" id="conflict_push_force"><span class="icon"></span> <span class="text"><abbr title="Overwrite copy on Repo">OVERWRITE</abbr> (push FORCE)</span></button>' +
                
                '<div class="notice"></div>' +
            '</div>' +
            '<div class="conflict-inner">' +
                '<div class="diff-container"></div>' +
            '</div>'
        );


        ExtOptions.openDialog(title, content, 'dialog-conflict', function(caller)    {
            
            let contentDiff = RepoHelper.renderDiff(projectItem_mine, projectItem_their)
            content.find('.diff-container').html(contentDiff);

            // bind buttons
            content.find('#conflict_localmerge_mine').on('click', function() {
            });

            content.find('#conflict_localmerge_their').on('click', function() {
            });
            
            content.find('#conflict_push_force').on('click', function() {
            });
        });
    },
    

    /**
     * Common ajax request header
     */
    getAjaxRequestHeaders : function () {
        return {
            'XCore-Request-Type': 'Ajax',   // one sure way to detect xhr call is to just pass that info by yourself
            'Switcher-Repo-Key': $('#repo_key').val() ?? ExtOptions.options.repo_key,
            'Switcher-Repo-Version-Request': minRepoVersionRequest,
        }
    },


    /**
     * Try to connect, update auth level if succeeded
     */
    ajaxRequest_handshake : function ()  {
        
        // reset auth state
        RepoHelper.updateAuthLevelState('');

        //caller.find('.dialog-fetch .dialog-inner').addClass('ajax-loading');
        //ExtOptions.ajaxAddLoaderImage( caller.find('.dialog-fetch .dialog-inner') );
        let url = ExtOptions.options.repo_url ?? $('#repo_url').val();
        if (!url)   {
            ExtOptions.displayMessage( 'No repo url specified!', 'error', '.dialog-fetch .repo-config .notice', 5000 );
            return;
        }

        $.ajax({
            url: url,
            data: {
                action: 'handshake',
            },
            dataType: 'json',
            headers: RepoHelper.getAjaxRequestHeaders(),
        })
            .done(function(data) {
                // reset message box - todo later: make this better, clear notice automatically
                $( '.dialog-fetch .fetch-inner .status' ).html('').removeClass('show');

                if (typeof (data.last_message) === "object") {
                    ExtOptions.displayMessage( data.last_message[0], data.last_message[1], '.dialog-fetch .fetch-inner .status', 99999 );
                }

                if (data.success === true)  {
                    RepoHelper.updateAuthLevelState( data.access_level );
                }
                else    {
                    ExtOptions.displayMessage('Success = false, error: ' + data.error, 'error', '.dialog-fetch .fetch-inner .status', 99999 );
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                let message = errorThrown + ', status: ' + jqXHR.status;
                ExtOptions.displayMessage( 'Ajax repo call failed: ' + message, 'error', '.dialog-fetch .fetch-inner .status', 99999 );
            })
            /*.always(function() {
                caller.find('.ajax-target').removeClass('ajax-loading');
            })*/;


        // save repo settings
        RepoHelper.saveRepoSettings(true);
    },


    /**
     * Request projects list from repo, possibly filtered
     * @param caller
     */
    ajaxRequest_fetchProjects : function(caller)  {
        
        let url = $('#repo_url').val();
        if (!url)   {
            ExtOptions.displayMessage( 'No repo url specified!', 'error', '.dialog-fetch .repo-config .notice', 5000 );
            return;
        }

        // prepare placeholder for ajax data
        caller.find('.ajax-target').empty();
        caller.find('.ajax-target').addClass('ajax-loading');
        ExtOptions.ajaxAddLoaderImage( caller.find('.ajax-target') );

        // call for ajax data
        // https://forum.jquery.com/topic/ajax-get-prompting-for-credentials
        $.ajax({
            url: url,
            data: {
                //key: $('#repo_key').val(),
                action: 'fetch',
                filter: $('#repo_fetch_filter').val(),
            },
            dataType: 'json',
            headers: RepoHelper.getAjaxRequestHeaders(),
        })
            .done(function(data) {
                // reset message box - todo later: make this better, clear notice automatically
                $( '.dialog-fetch .fetch-inner .status' ).html('').removeClass('show');
                
                // update auth state from response
                RepoHelper.updateAuthLevelState( data.access_level );

                // fill results
                caller.find('.ajax-target').html(
                    '<p>Found items: <b>'+ data.result.length +'</b></p>' +
                    ( data.result.length ?
                        // todo: make this confirmable
                        '<button class="btn getAll"><span class="icon"></span> <span class="text">Import all <abbr title="Only imports new, doesn\'t update these uuids which are found to already exist in config">missing</abbr></span></button>' : '' )
                );

                if ( typeof (data.last_message) === "object") {
                    ExtOptions.displayMessage( data.last_message[0], data.last_message[1], '.dialog-fetch .fetch-inner .status', 99999 );
                }

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
                ExtOptions.displayMessage( 'Ajax repo call failed: ' + message, 'error', '.dialog-fetch .fetch-inner .status', 99999 );
            })
            .always(function() {
                caller.find('.ajax-target').removeClass('ajax-loading');
            });

        // save settings
        RepoHelper.saveRepoSettings(true);
    },

    
    /**
     * Post project to repository
     */
    ajaxRequest_pushProject : function (project)  {

        console.log('----------------------');
        console.log(ExtOptions.options.repo_url);
        console.log(ExtOptions.options);
        // console.log(project);

        //caller.find('.dialog-fetch .dialog-inner').addClass('ajax-loading');
        //ExtOptions.ajaxAddLoaderImage( caller.find('.dialog-fetch .dialog-inner') );
        let url = $('#repo_url').val() ?? ExtOptions.options.repo_url;
        if (!url)   {
            ExtOptions.displayMessage( 'No repo url specified!', 'error'/*, '.dialog-fetch .repo-config .notice', 5000*/ );
            return;
        }
        
        console.log('========');
        
        // 1st STEP:
        // post project
        
        // let projectData = JSON.stringify( ExtOptions.readProjectData( project ), null, 4 ) + "\n";
        let projectItem = ExtOptions.readProjectData( project );
        // let projectData = JSON.stringify( projectItem );
        // todo later: finally it should exchange objects/arrays through ajax, so leave json and let the model do its job to build properly



        $.ajax({
            url: url,
            method: 'POST',
            data: {
                action: 'push',
                projectData: projectItem,
            },
            dataType: 'json',
            headers: RepoHelper.getAjaxRequestHeaders(),
        })
            .done(function(data) {
                // reset message box - todo later: make this better, clear notice automatically
                $( '.dialog-fetch .fetch-inner .status' ).html('').removeClass('show');

                // update auth state from response
                RepoHelper.updateAuthLevelState( data.access_level );

                if (typeof (data.last_message) === 'object') {
                    ExtOptions.displayMessage( data.last_message[0], data.last_message[1], '', 10000 );
                }


                // 2nd STEP:
                // auth=write, no conflicts, project stored = success. close dialog, mark Project on list?

                if (data.success === true)  {
                    ExtOptions.displayMessage('Successfully pushed Project to the Repository.', 'success');
                }
                else    {

                    // 3rd STEP:
                    // conflict situation: if uuid exists (or name found / matches / similar?) return status 'conflict'
                    // display dialog with diff / overwrite / merge

                    switch (data.code) {
                        case 'EXCEPTION_DATA_ERROR':
                            // ExtOptions.displayMessage('Cannot push: ' + data.code, 'warn');
                            break;

                        case 'CONFLICT_UUID':
                            // such uuid already exist on repo
                        case 'CONFLICT_NAME':
                            // similar name found in other project(s). maybe it's someones clone.

                            // display dialog: diff + merge (pull to local and push later) + confirm overwrite (force push) //with selected from the two or pull & replace local
                            RepoHelper.conflictDialog('Projects conflicted - resolve', '', projectItem, data.result.project_conflicted ?? []);
                            break;
                        default:
                            // ExtOptions.displayMessage('Cannot push: ' + data.code, 'error');
                    }
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                let message = errorThrown + ', status: ' + jqXHR.status;
                ExtOptions.displayMessage( 'Ajax repo call failed: ' + message, 'error', '.dialog-fetch .fetch-inner .status', 99999 );
            })
            /*.always(function() {
                caller.find('.ajax-target').removeClass('ajax-loading');
            })*/;
    },
    
    
    saveRepoSettings : function(silent)  {
        alert('XXXXXXXXXXX');
        chrome.storage.sync.set({
            'repo_url' :   $( '#repo_url' ).val(),
            'repo_key' :   $( '#repo_key' ).val(),
        }, function() {
            if (chrome.runtime.lastError)   {
                ExtOptions.displayMessage( 'Options save problem -  ' + chrome.runtime.lastError.message, 'error', '.dialog-fetch .repo-config .notice', 100000 );
            }
            else    {
                if (!silent)    {
                    ExtOptions.displayMessage( 'Saved', 'info', '.dialog-fetch .repo-config .notice', 4000 );
                }
                // have to be set in case of reopen modal to show up-to-date state
                ExtOptions.options.repo_url = $( '#repo_url' ).val();
                ExtOptions.options.repo_key = $( '#repo_key' ).val();
            }
        });
    },


    /**
     * It's good to refresh auth state at every ajax call, to keep the options/repo GUI in sync with current (recent) access level
     * @param level string
     */
    updateAuthLevelState : function(level)  {
        RepoHelper.authLevel = level || '';
        $('#repo_auth_level').html( RepoHelper.authLevel );
        
        // control gui visibility and functionality
        
        switch (RepoHelper.authLevel) {
            case 'WRITE':
                $('.env_projectPush').removeClass('hide');
                break;
            default:
                $('.env_projectPush').addClass('hide');
        }
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


    /**
     * So called "overdialog" - is not actual first level dialog, rather a mini-dialog above the right one
     * @param projectPreviewItem
     */
    displayComparison : function(projectPreviewItem) {

        let projectExistingItem = ExtOptions.readProjectData( $('#project_'+projectPreviewItem.uuid) );
        let content = RepoHelper.renderDiff(projectExistingItem, projectPreviewItem);

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
        ExtOptions.dialogToCloseOnGlobalEvents = overdialog;
    },


    /**
     * Prepare nice view of two json configs diffed
     * @param project_left
     * @param project_right
     * @return {*|jQuery|HTMLElement}
     */
    renderDiff : function(project_left, project_right) {

        let left_modTime = new Date(project_left.tstamp * 1000);
        let right_modTime = new Date(project_right.tstamp * 1000);
        let left_modTime_nice = project_left.tstamp ? left_modTime.toDateString() + ' ' + left_modTime.toUTCString() + ( project_left.tstamp > project_right.tstamp ? ' ( NEWER )' : '' ) : '';
        let right_modTime_nice = project_right.tstamp ? right_modTime.toDateString() + ' ' + right_modTime.toUTCString() + ( project_right.tstamp > project_left.tstamp ? ' ( NEWER )' : '' ) : '';

        let content = $( '<div class="row">' +
                '<div class="col-6 compare-mine"><h1>Mine (existing) <br><i class="small">modify time: '+ left_modTime_nice +'</i> </h1></div>' +
                '<div class="col-6 compare-theirs"><h1>Their (remote) <br><i class="small">modify time: '+ right_modTime_nice +'</i> </h1></div>' +
            '</div>' );

        delete project_right.hidden;  // don't compare that - unset for comparison
        delete project_left.hidden;

        let project_left_string = JSON.stringify(project_left, null, 4);
        let project_right_string = JSON.stringify(project_right, null, 4);


        content.find( '.compare-mine' ).append('<div class="compare-diff">' +
                project_right_string.diff( project_left_string ) +
            '</div>'
        );

        content.find( '.compare-theirs' ).append('<div class="compare-diff">' +
                project_left_string.diff( project_right_string ) +
            '</div>'
        );
        
        return content;
    },
    
    
    versionToInt : function( string )   {
        let parts = string.split('.');
        return parseInt( parts[0].padStart(3, '') + parts[1].padStart(3, '') + parts[2].padStart(3, '') );
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
