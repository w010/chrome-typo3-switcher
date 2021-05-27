<?php


/**
 * Class XCoreAppRunner
 */
abstract class XCoreAppRunner
{
    /**
     * Prepare system environment and make sure it's ready and operational + other tech stuff
     * Also setup XCore low-level essentials like filesystem, autoload etc.
     * Often customized in local AppRunner, but no need to.
     */
    static public function ready(): void
    {
        static::setErrorHandling();
        static::doTheClassicInit();
        static::runClassLoader();
    }

    /**
     * Create the App - prepare App/XCore object
     * XCore is basically a singleton, so only touch it, to make it builds instance and possibly does some init
     */
    abstract static public function set(): void;


    /**
     * Run the App.
     * Main method called to start operation.
     * Usually it calls App->handleRequest() or does something similar.
     */
    abstract static public function go(): void;



    /**
     * Set error display
     */
    static protected function setErrorHandling(): void
    {
        error_reporting(E_ALL ^ E_NOTICE ^ E_WARNING ^ E_STRICT ^ E_DEPRECATED);
        // on some projects / envs might be needed to see what's happening when you 500)
        //error_reporting(-1); // reports all errors
        ini_set('display_errors', '1'); // shows all errors
        //ini_set('log_errors', 1);
    }


    /**
     * Do the classic init
     */
    static protected function doTheClassicInit(): void
    {
        // return;
        if (!defined('PATH_site'))	{
            define('PATH_thisScript', str_replace('//', '/', str_replace('\\', '/',
                (PHP_SAPI == 'fpm-fcgi' || PHP_SAPI == 'cgi' || PHP_SAPI == 'isapi' || PHP_SAPI == 'cgi-fcgi') &&
                ($_SERVER['ORIG_PATH_TRANSLATED'] || $_SERVER['PATH_TRANSLATED']) ?
                ($_SERVER['ORIG_PATH_TRANSLATED'] ?: $_SERVER['PATH_TRANSLATED']) :
                ($_SERVER['ORIG_SCRIPT_FILENAME'] ?: $_SERVER['SCRIPT_FILENAME']))));
            // define('PATH_site', realpath(dirname(PATH_thisScript)).'/');
// todo check and test this under linux
            define('PATH_site', str_replace('/', '\\', realpath(dirname(PATH_thisScript)).'/'));
        }
    }


    /**
     * Initialize Class Loader
     */
    static protected function runClassLoader(): void
    {
        require_once PATH_site . '/src/XCoreLoader.php';
        require_once PATH_site . '/app/Loader.php';
        
        Loader::includeClasses();
    }
    
}


