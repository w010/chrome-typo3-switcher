<?php

/**
 * Viewhelper abstract
 */
abstract class XCoreViewhelper  {

    /**
     * @var XCore|object
     */
    protected $App;


    /**
     * View 
     * @var View|null 
     */
	protected $View = null;




    public function __construct()
    {
        $this->App = XCore::App();
        // use only if needed
        //$this->View = Loader::get(View::class, View::TYPE__WIDGET);
    }


    /**
     * Compile the body to output
     * 
     * @return string
     * @throws Exception
     */
    abstract public function render(): string;
}


