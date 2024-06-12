/**
 * TYPO3 Backend-Frontend Handy Switcher - Chrome extension
 *
 * wolo.pl '.' studio 2020-21
 * Adam wolo Wolski
 * wolo.wolski+t3becrx@gmail.com
 */

/**
 * Project repository script
 */



const minRepoVersionRequest = '0.2.0';    // repo performs auto-check and sends info about incomatibility or deprecation


let RepoHelper = {

    // store last auth level to control gui (don't rely on that, it's not a security control)
    authLevel: '',

    
    
    
    /**
     * Dialog about fetching projects from repo
     * @param title string
     * @param message string
     */
    repoFetchDialog: function(title, message)   {

        let content = 
            $( '<div class="repo-config">' +
                '<div class="notice"></div>' +  // only color notice, no status box here
            '</div>' +
            '<div class="fetch-inner">' +
                '<p>Request Repository for a list of projects available to import:</p>' +
                '<div class="fetch-controls">' +
                '<label class="primary">' +
                    '<input type="text" id="repo_fetch_filter" placeholder="Filter by name"> <button class="btn fetch" id="repo_fetch"><span class="icon"></span> <span class="text">Fetch projects list</span></button>' +
                '</label>' +
                '<div class="message status"></div>' +
                '<div class="fetched-projects ajax-target"></div>' +
            '</div>'
        );

        let dialogTitle = 'Repository: check out projects';

        ExtOptions.openDialog(dialogTitle, content, 'dialog-repo-fetch  text-left', function(caller)    {

            // bind fetch button
            content.find('#repo_fetch').on('click', function() {
                RepoHelper.ajaxRequest_fetchProjects( $(this) );
            });

            // on enter key pressed in filter input
            content.find('#repo_fetch_filter').focus().on( 'keypress', function(e) {
                if ( e.which === 13 )       RepoHelper.ajaxRequest_fetchProjects(caller);
            })
        });
    },
    
    
    /**
     * Help modal about repo
     * @param title string
     * @param message string
     */
    repoHelpDialog: function(title, message)   {

        let content = 
            $('<div class="help-inner">' +
                '<h3>What\'s that and what for?</h3>' +
                '<p>Remote Repository can keep Projects to help keep them up to date, exchange setups with your team, sync your browsers (Chrome - Firefox), or just backup. ' +
                    'It comes especially helpful, when you work with dozens of projects, multiple stages and a number of teammates. But you can take advantages of this feature also when working alone.</p>' +
                '<br>' +

                '<h3>Quick test how that works:</h3>' +
                '<p>Make a try using this <a id="repo_example" href="#">Example Demo Repo</a>. Click Fetch and see what it does.<br>' +
                '<i>[In the Demo repository projects are not stored on server, but push dialog is there to test]</i></p>' +
                '<br>' +
                
                '<h3>Host own Repo:</h3>' +
                '<p>There are two roads to go:</p>' +
                '<p>1. Use featured Projects Repository micro app, it\'s a 5 minute job, unpack, set keys, add optional htpassword. Optionally add some projects. ' +
                    '<a class="external" href="http://wolostudio.free.nf/handyswitcher/projectrepo/" target="_blank">See details</a>.</p>' +
                '<p>or 2. Go pro and ie. write a TYPO3 extension for that. I didn\'t do this yet, but it\'s somewhere on a todo-list.</p>' +
            '</div>'
        );

        let dialogTitle = 'Project Repository - Info / Help';
        
        let dialog = ExtOptions.openDialog(dialogTitle, content, 'dialog-repo-help  text-left', function(caller)    {
        
            // bind test link
            content.find('#repo_example').on('click', function() {
                $('#env_repo_url')
                    .val('http://wolostudio.free.nf/handyswitcher/repoexample/');
                $('#env_repo_key')
                    .val('fakeWriteKeyForDemo');
                ExtOptions.optionsSave();

                ExtOptions.closeDialog( dialog );
                $('.__projects-remote').addClass('help-tour');
                $('.help-tour').click(function(){
                    $(this).removeClass('help-tour');
                });
                $('#env_repo_fetch')
                    .addClass('tour-mark')
                    .append('<span class="tour-point">&#10152;</span>');
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
    conflictDialog: function(title, message, projectItem_mine, projectItem_their)   {

        let content = 
            $( '<div class="conflict-resolve">' +
                '<button class="btn merge" id="conflict_localmerge_mine"><span class="icon"></span> <span class="text"><abbr title="Pull the remote one, merge them together and edit locally to push later">Manual merge</abbr> (MINE priority)</span></button>' +
                '<button class="btn merge" id="conflict_localmerge_their"><span class="icon"></span> <span class="text"><abbr title="Pull the remote one, merge them together and edit locally to push later">Manual merge</abbr> (THEIR priority)</span></button>' +
                '<button class="btn confirm-warn replace-remote" id="conflict_push_force"><span class="icon"></span> <span class="text"><abbr title="Overwrite copy on Repo">OVERWRITE</abbr> (push FORCE)</span></button>' +
                
                '<div class="notice"></div>' +
            '</div>' +
            '<div class="conflict-inner">' +
                '<div class="diff-container"></div>' +
            '</div>'
        );


        let mergeDialog = ExtOptions.openDialog(title, content, 'dialog-conflict', function(caller)    {
            
            let contentDiff = RepoHelper.renderDiff(projectItem_mine, projectItem_their)
            content.find('.diff-container').html(contentDiff);
            let project_mine = $( '#project_'+projectItem_mine.uuid );

            let mineContextNames = [];
            project_mine.find( '.contextItem [name="context[name]"]' ).each(function(){
                mineContextNames.push( $(this).val() );
            });
            
            let mineLinkNames = [];
            project_mine.find( '.linkItem [name="link[name]"]' ).each(function(){
                mineLinkNames.push( $(this).val() );
            });


            // bind buttons

            // merge - MINE
            content.find('#conflict_localmerge_mine').on('click', function() {
                // keep name, iterate incoming contexts - if name not found in local, add item

                // insert context, if not found existing
                $.each(projectItem_their.contexts, function( i, context ) {
// todo: indexOf may match too early! doesn't compare full strings, only first match
// check this, maybe works ok
                    if( mineContextNames.indexOf( context.name ) < 0 ) {
                        // insert and mark new items
                        ExtOptions.insertContextItem( project_mine, context )
                            .addClass('new');
                    }
                });

                // + links
                $.each(projectItem_their.links, function( i, link ) {
                    if( mineLinkNames.indexOf( link.name ) < 0 ) {
                        ExtOptions.insertLinkItem( project_mine, link )
                            .addClass('new');
                    }
                });
                
                // close modal  // and go to the project
                ExtOptions.closeDialog( mergeDialog );
                project_mine.find('.toggle.project').trigger('click');
                $('html,body').animate({scrollTop: project_mine.offset().top - 100}, 300);
            });



            // merge - THEIR
            content.find('#conflict_localmerge_their').on('click', function() {
                
                // close modal  // and go to the project - first
                ExtOptions.closeDialog( mergeDialog );
                project_mine.find('.toggle.project').trigger('click');
                $('html,body').animate({scrollTop: project_mine.offset().top - 100}, 300);
                
                // replace name, ignore hide val, add contexts, replace current if exist
                project_mine.find('[name="project[name]"]').val( projectItem_their.name );

                // contexts
                $.each(projectItem_their.contexts, function( i, context ) {
                    let existingItemIndex = $.inArray( context.name, mineContextNames )
              
                    if( existingItemIndex > -1 ) {
                        // if such exists, replace with incoming
                        let itemIndexCorrected = existingItemIndex + 1;
                        let contextToReplace = project_mine.find('.contextItem:nth-child('+itemIndexCorrected+')');
                        let contextOverride = ExtOptions.insertContextItem( project_mine, context, false )
                            .addClass('new');
                        contextToReplace.replaceWith( contextOverride );
                    }
                    else    {
                        // insert on end
                        ExtOptions.insertContextItem( project_mine, context, true )
                            .addClass('new');
                    }
                });

                // and links
                $.each(projectItem_their.links, function( i, link ) {
                    let existingItemIndex = $.inArray( link.name, mineLinkNames )

                    if( existingItemIndex > -1 ) {
                        let itemIndexCorrected = existingItemIndex + 1;
             
                        let linkToReplace = project_mine.find('.linkItem:nth-child('+itemIndexCorrected+')');
                        let linkOverride = ExtOptions.insertLinkItem( project_mine, link, false )
                            .addClass('new');
                        linkToReplace.replaceWith( linkOverride );
                    }
                    else    {
                        ExtOptions.insertLinkItem( project_mine, link, true )
                            .addClass('new');
                    }
                });

                ExtOptions.initCheckboxes();
            });


            
            content.find('#conflict_push_force').on('click', function() {
                RepoHelper.ajaxRequest_pushProject( $('#project_'+projectItem_mine.uuid), 1, $(this) );
            });
        });
    },
    

    /**
     * Common ajax request header
     */
    getAjaxRequestHeaders: function () {
        return {
            'XCore-Request-Type': 'Ajax',   // one sure way to detect xhr call is to just pass that info by yourself
            'Switcher-Repo-Key': ExtOptions.options.env_repo_key ?? $('#env_repo_key').val(),
            'Switcher-Repo-Version-Request': minRepoVersionRequest,
        }
    },


    /**
     * Try to connect, update auth level if succeeded
     */
    ajaxRequest_handshake: function (caller)  {
        
        // reset auth state
        RepoHelper.updateAuthLevelState(' ');

        // start animation
        caller.closest('p').addClass('ajax-loading');
        ExtOptions.ajaxAddLoaderImage( caller.closest('p') );

        let url = ExtOptions.options.repo_url ?? $('#env_repo_url').val();
        if (!url)   {
            ExtOptions.displayMessage( 'No repo url specified!', 'error');
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
                if (data.success === true)  {
                }
                else    {
                    // default feedback to unsuccessful call
                    ExtOptions.displayMessage('Success = false, error: ' + data.error, 'error' );
                }
                if (typeof (data.last_message) === 'object') {
                    // replaced here if message object came
                    ExtOptions.displayMessage( data.last_message[0], data.last_message[1] );
                }
                // set access level always
                RepoHelper.updateAuthLevelState( data.access_level );
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                let message = errorThrown + ', status: ' + jqXHR.status;
                ExtOptions.displayMessage( 'Ajax repo call failed: ' + message, 'error' );
            })
            .always(function() {
                // stop animation
                caller.closest('p').removeClass('ajax-loading');
            });
    },


    /**
     * Request projects list from repo, possibly filtered
     * @param caller
     */
    ajaxRequest_fetchProjects: function(caller)  {
        
        let url = ExtOptions.options.repo_url ?? $('#env_repo_url').val();
        if (!url)   {
            ExtOptions.displayMessage( 'No repo url specified!', 'error');
            return;
        }

        // prepare placeholder for ajax data
        let ajaxTarget = caller.closest('.fetch-controls').find('.ajax-target');

        ajaxTarget.empty();
        // inserting loader into target doesn't make sense, since it's empty and height 0
        //caller.find('.ajax-target').addClass('ajax-loading');
        //ExtOptions.ajaxAddLoaderImage( caller.find('.ajax-target') );
        caller.closest('div').addClass('ajax-loading');
        ExtOptions.ajaxAddLoaderImage( caller.closest('div') );
        
        // call for ajax data
        // https://forum.jquery.com/topic/ajax-get-prompting-for-credentials
        $.ajax({
            url: url,
            data: {
                //key: $('#repo_key').val(),    // send key in header
                action: 'fetch',
                filter: $('#repo_fetch_filter').val(),
            },
            dataType: 'json',
            headers: RepoHelper.getAjaxRequestHeaders(),
        })
            .done(function(data) {
                // reset message box - todo later: make this better, clear notice automatically
                $( '.dialog-repo-fetch .fetch-inner .status' ).html('').removeClass('show');
                
                // update auth state from response
                RepoHelper.updateAuthLevelState( data.access_level );

                // fill results
                ajaxTarget.html(
                    '<p>Found items: <b>'+ data.result.length +'</b></p>' +
                    ( data.result.length ?
// todo: make this confirmable
                        '<button class="btn getAll"><span class="icon"></span> <span class="text">Import all <abbr title="Only imports new, doesn\'t update these uuids which are found to already exist in config">missing</abbr></span></button>' : '' )
                );

                if ( typeof (data.last_message) === "object") {
                    ExtOptions.displayMessage( data.last_message[0], data.last_message[1], '.dialog-repo-fetch .fetch-inner .status', 99999 );
                }

                $('.dialog-repo-fetch button.getAll').on('click', function(){
                    let importableItems = ajaxTarget.find('button.get');
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
                ExtOptions.displayMessage( 'Ajax repo call failed: ' + message, 'error', '.dialog-repo-fetch .fetch-inner .status', 99999 );
            })
            .always(function() {
                caller.closest('div').removeClass('ajax-loading');
            });
    },

    
    /**
     * @param project Dom element (not array!)
     * @param force bool overwrite without confirming (second step push)
     * @param caller dom element that triggers the action
     * Post project to repository
     */
    ajaxRequest_pushProject: function (project, force, caller)  {

        caller.closest('div').addClass('ajax-loading');
        ExtOptions.ajaxAddLoaderImage( caller.closest('div') );

        let url = ExtOptions.options.repo_url ?? $('#env_repo_url').val();
        if (!url)   {
            ExtOptions.displayMessage( 'No repo url specified!', 'error');
            return;
        }
        force = force || 0;
        
        
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
                force: force,
                projectData: projectItem,
            },
            dataType: 'json',
            headers: RepoHelper.getAjaxRequestHeaders(),
        })
            .done(function(data) {
                // reset message box - todo later: make this better, clear notice automatically
                $( '.dialog-repo-fetch .fetch-inner .status' ).html('').removeClass('show');

                // update auth state from response
                RepoHelper.updateAuthLevelState( data.access_level );


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
                if (typeof (data.last_message) === 'object') {
                    ExtOptions.displayMessage( data.last_message[0], data.last_message[1] );
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                let message = errorThrown + ', status: ' + jqXHR.status;
                ExtOptions.displayMessage( 'Ajax repo call failed: ' + message, 'error');
            })
            .always(function() {
                caller.closest('div').removeClass('ajax-loading');
            });
    },
    
    


    /**
     * It's good to refresh auth state at every ajax call, to keep the options/repo GUI in sync with current (recent) access level
     * @param level string
     */
    updateAuthLevelState: function(level)  {
        RepoHelper.authLevel = level || 'unauthorized';
        let $repo_auth_level = $('#repo_auth_level');
        $repo_auth_level.html( RepoHelper.authLevel );
        
        // control gui visibility and functionality
        let $body = $('body');
        $body
            .removeClass('repo_auth__write repo_auth__read repo_auth__admin repo_auth__unknown');
        
        switch ( RepoHelper.authLevel ) {
            case 'READ':
                $body
                    .addClass('repo_auth__read');
                $repo_auth_level
                    .removeClass().addClass('level-info');
                break;
            case 'WRITE':
                $body
                    .addClass('repo_auth__write');
                $repo_auth_level
                    .removeClass().addClass('level-success');
                break;
            case 'ADMIN':
                $body
                    .addClass('repo_auth__write repo_auth__admin');
                $repo_auth_level
                    .removeClass().addClass('level-success');
                break;
            default:
                /*$body
                    .addClass('repo_auth__unknown');*/
                $repo_auth_level
                    .removeClass().addClass('level-error');
        }
    },
    
    /**
     * Insert project preview item block
     * @param projectItem object
     */
    buildProjectPreviewItem: function(projectItem)   {
        let projectPreview = $( '<div class="project-item-preview project-uuid--'+ projectItem.uuid +'">' +
                '<h3 class="name">'+ projectItem.name +'<span class="infoicon"></span></h3>' +
                '<div class="contexts"><p>Contexts:</p></div>' +
                '<div class="links"><p>Links:</p></div>' +
                '<div class="buttons">' +
                    '<button class="btn compare"><span class="icon"></span> <span class="text">Compare</span></button>' +
                    '<button class="btn confirm-warn replace-local"><span class="icon"></span> <span class="text">Replace existing</span></button>' +
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
        projectPreview.find( 'button.replace-local' ).click( function() {
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
    

    animateAddProject: function (project)  {
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
    displayComparison: function(projectPreviewItem) {

        let projectExistingItem = ExtOptions.readProjectData( $('#project_'+projectPreviewItem.uuid) );
        let content = RepoHelper.renderDiff(projectExistingItem, projectPreviewItem);
        let dialog = ExtOptions.openDialog('Compare config', content, 'text-left dialog-compare');
    },


    /**
     * Prepare nice view of two json configs diffed
     * @param project_left
     * @param project_right
     * @return {*|jQuery|HTMLElement}
     */
    renderDiff: function(project_left, project_right) {

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

        let project_left_string = JSON.stringify(project_left, null, 4).replaceAll(/(["{}\[\],])/gm, ' ').replaceAll(/( :)/gm, ':');
        let project_right_string = JSON.stringify(project_right, null, 4).replaceAll(/(["{}\[\],])/gm, ' ').replaceAll(/( :)/gm, ':');

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
    
    
    versionToInt: function( string )   {
        let parts = string.split('.');
        return parseInt( parts[0].padStart(3, '') + parts[1].padStart(3, '') + parts[2].padStart(3, '') );
    },
};



/**
 * String diff helper / found online so don't ask me how it works
 */

Array.prototype.rotate = function (n) {
    let len = this.length;
    return !(n % len) ? this
        : n > 0 ? this.map((e, i, a) => a[(i + n) % len])
            : this.map((e, i, a) => a[(len - (len - i - n) % len) % len]);
};

String.prototype.diff = function (s) {

    let getBaseIndex = function (s, l) { // returns the index of first mismatching character
        let i = 0;
        while (s[i] === l[i] && i < s.length) ++i;
        return i;
    },

    findFirstChange = function (s, l) { // returns the first matching substring after base index
        let fi = len,
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
    let
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

    for (let rc = 0; rc < len; rc++) { // rc -> rotate count
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
