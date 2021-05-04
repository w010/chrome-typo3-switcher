<?php




class ClassLoader extends XCoreClassLoader  {


    const XCLASS_MAP = [
        // replace original with app local extension class
        XCoreUtil::class => Util::class,
        XCoreView::class => View::class,
        //XCorePage::class => Page::class,
    ];




    /**
     * Put all php includes into this implementation
     * 
     * @return void
     */
    /*public function includeClasses(): void
    {
        parent::includeClasses();
        
        // include here all custom App code which can't be autoloaded
        // require_once 'MyClass.php';
    }*/
}

