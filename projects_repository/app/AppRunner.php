<?php


require_once __DIR__.'/../src/XCoreAppRunner.php';



/**
 * Local AppRunner
 */
class AppRunner extends XCoreAppRunner
{

    protected function init(): void
    {
        parent::init();
    }


    public function go(): void
    {
        include_once 'RepositoryApp.php';
        /** @var $App RepositoryApp */
        $App = ClassLoader::makeInstance(RepositoryApp::class);
        $App->handleRequest();
    }
}


