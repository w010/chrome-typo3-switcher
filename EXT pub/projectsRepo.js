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
        caller.find('.dialog-body').addClass('ajax-target');
        ExtOptions.ajaxAddLoaderImage( caller.find('.ajax-target') );

        // call for ajax data
        // caller.find('.ajax-target').html('ajax inserted!');
    }
};
