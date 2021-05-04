<?php


/**
 * Class XCoreAppRunner
 */
abstract class XCoreAppRunner
{
    
    public function __construct()
    {
        $this->init();
    }

    /**
     * Setup system environment etc. 
     */
    protected function init(): void
    {
        static::setErrorHandling();
        static::doTheClassicInit();
        static::runClassLoader();
    }


    /**
     * Main method called to start operation 
     */
    abstract public function go(): void;



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
//define('PATH_site', 'D:\WORK\_chrome\handyswitcher\projects_repository' . "\\");
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
        require_once PATH_site . '/src/XCoreClassLoader.php';
        require_once PATH_site . '/app/ClassLoader.php';
        
        ClassLoader::getLoader()->includeClasses();
    }
    
}


