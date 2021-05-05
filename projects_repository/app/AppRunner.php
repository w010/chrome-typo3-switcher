<?php


require_once __DIR__.'/../src/XCoreAppRunner.php';



/**
 * Local AppRunner
 * We can use here calls with XCore class instead our SomeApp, because Loader resolves this override automatically
 */
class AppRunner extends XCoreAppRunner
{

    /**
     * Prepare system
     */
    static public function ready(): void
    {
        parent::ready();
    }


    /**
     * Setup app
     */
    static public function set(): void
    {
        Loader::get(XCore::class)
            ->init();
    }


    /**
     * Run
     */
    static public function go(): void
    {
        Loader::get(XCore::class)
            ->handleRequest();
    }
}


