<?php




class Loader extends XCoreLoader  {


    // when instantiated, replace these originals with local extension classes.
    // [ originalClass => $replacement, ... ]
    const XCLASS_MAP = [

        // I think this one should be necessary, to be precised exactly here when making a new XC app.
        XCore::class => RepositoryApp::class,

        // class for static calls only! so won't work this way. informative only, keep commented out.
        //XCoreUtil::class => Util::class,

        // needed to be defined when instantiate child class, to use its statics as params.
        XCoreView::class => View::class,
        XCorePage::class => Page::class,
    ];




    /**
     * Put all php includes into this implementation
     * 
     * @return void
     */
    static public function includeClasses(): void
    {
        parent::includeClasses();
        
        // Put here manual includes of all custom App code which can't be autoloaded.
        // Avoid using include/require in other files than Loaders. Really it's a great place for this.

        //require_once PATH_site . 'app/ExampleClass.php';
    }
}

