<?php
		


class XCorePage  {
    
    protected $id = '';
    protected $title = '';
    protected $content = '';

    /**
     * Page type - may be used in child page classes to differentiate them somehow
     * @var string 
     */
    protected $type = 'default';

    /**
     * @var XCore|object
     */
    protected $App;

    /**
     * @var XCoreView|object
     */
    protected $View;


    public function __construct(string $id = '')
    {
        $this->App = XCore::App();
        $allPages = $this->App->getPagesConfig();

        $id = preg_replace('/[^a-zA-Z0-9_-]+/', '_', strtolower($id));
        if ($id && !in_array($id, array_keys($allPages))) {
            die ('Error - Invalid page value: ' . $id);
        }

        $this->id = $id;
        if (!$this->id) {
            $this->id = 'home';
        }
        $this->title = $allPages[$this->id]['title'];
    }

    /**
     * @return string
     */
    public function getId(): string
    {
        return $this->id;
    }
    
    /**
     * @return string
     */
    public function getTitle(): string
    {
        return $this->title;
    }
    
    /**
     * @return string
     */
    public function getType(): string
    {
        return $this->type;
    }

    /**
     * Returns result of Page rendering operations. Usually ->content property,
     * possibly also some control / debug / info data
     * @return array
     */
    public function getOutput(): array
    {
        return ['content' => $this->content];
    }


    /**
     * Compile Page from template, widgets, optional response data returned from actions called
     * @param array $response
     * @return void
     * @throws Exception
     */
    public function buildPageContent(array $response = []): void
    {
        $this->View = Loader::get(XCoreView::class, XCoreView::TYPE__PAGE);
        $this->View->setTemplate('page_'.$this->id);
         
        
        // specific page's content is usually generated using custom method in app/Page
        $pageContentBuildMethodName = 'buildPageContent_'.$this->id;

        // these methods are meant to be implemented specifically in child classes. problems with this means probably instantiating using wrong class. 
        if (!method_exists($this, $pageContentBuildMethodName)) {
            Throw new Exception('View exception: No page content generate method: ::'.$pageContentBuildMethodName.' in object '.get_class($this), 3459832);
        }

        $this->content = $this->$pageContentBuildMethodName();
    }
    
    /**
     * @return string
     * @throws Exception
     */
    protected function buildPageContent_home(): string
    {
        return 'Page->buildPageContent_home() - implement for your needs';
        /*$markers = [
            //'TOOLS' => Loader::get(ViewhelperTools::class)->render(),
        ];
        
        $this->View->assignMultiple($markers);
        $this->View->render();

        return $this->View->getOutput();*/
    }
}


