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
        console.log(caller);

        // prepare placeholder for ajax data
        caller.find('.ajax-target').addClass('ajax-loading');
        ExtOptions.ajaxAddLoaderImage( caller.find('.ajax-target') );

        // call for ajax data
        // https://forum.jquery.com/topic/ajax-get-prompting-for-credentials
        $.ajax({
            url: $('#repo_url').val(),
            data: { key: $('#repo_key').val() }, 
        })
            .done(function() {
                alert( "success" );
                // todo: build projects list
                // caller.find('.ajax-target').html('ajax inserted!');
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                let message = errorThrown + ', status: ' + jqXHR.status;
                caller.find('.ajax-target').html('<p class="level-error">Ajax repo call failed: ' + message + '</p>');
            })
            .always(function() {
                caller.find('.ajax-target').removeClass('ajax-loading');
            });
    }
};
