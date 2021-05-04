<?php
/**
 * Projects Repository app
 * Handy Switcher add-on
 *
 * 
 * BE/FE/Env Handy Switcher (TYPO3 dedicated, but is kind of universal)
 * Great help for integrators with many web projects, that runs on multiple paralell environments/contexts.
 * 
 * 
 * Subpackage: Projects Repository
 * 
 * 
 * wolo.pl '.' studio
 * 2017-2021
 * wolo.wolski(at)gmail.com
 * https://wolo.pl/
 * 
 * https://chrome.google.com/webstore/detail/typo3-backend-frontend-ha/ohemimdlihjdeacgbccdkafckackmcmn
 * https://github.com/w010/chrome-typo3-switcher
 */


call_user_func(function () {
    require_once __DIR__.'/app/AppRunner.php';
    $AppRunner = new AppRunner();
    $AppRunner->go();
});

