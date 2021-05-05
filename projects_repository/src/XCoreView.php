<?php




class XCoreView  {

    /**
     * @var string View generated output
     */
    protected $output = '';


    /**
     * @var array Items to replace in view
     */
    protected $markers = [];


    /**
     * @var string Path to template directory
     */
    protected $templatesPath = '';


    /**
     * XCore App
     * @var XCore|object 
     */
    protected $App = null;


    public function __construct(XCore $XCoreApp)
    {
        $this->App = $XCoreApp;
        $this->templatesPath = PATH_site . rtrim(
            ($this->App->getConfVar('templatesPath') ?? 'templates')
                , '/').'/';
    }


    /**
     * @param array $response Response data for a handled request (usually for ajax)
     * @throws Exception
     */
    public function buildContent(array $response = [])
    {
        $baseTemplate = $this->readTemplateFile('base.html');

        try {
            $this->assign('###BASE_HREF###', $this->App->getConfVar('baseHref'));
            $this->assign('###MENU_MAIN###', $this->buildMenu());
        } catch (Exception $e)  {
            $this->App->msg('View exception ('.$e->getCode().'): ' . $e->getMessage());
        }

        $this->assign('###MESSAGES###', $this->displayMessages());
        $this->assign('###PAGE_CONTENT###', $this->buildPageContent());

        $this->output = $this->substituteMarkerArray($baseTemplate, $this->markers);
    }
    
    


    /**
     * @return string
     * @throws Exception
     */
    protected function buildMenu(): string
    {
        if (!$this->App->getMenuMain())  
            return '';
        
        $pages = $this->App->getPages();

        $templateMenu = $this->readTemplateFile('menu.html');
        $contentMenuMain = '';
        foreach ($this->App->getMenuMain() as $menuItem) {
            $ma = [
                '###TITLE###' => $menuItem['pageId'] ? $pages[$menuItem['pageId']]['title'] : ($menuItem['title'] ?? 'NO TITLE!'),
                '###HREF###' => $menuItem['href'],
                '###LINK_CLASS###' => $this->App->getPageObject()->getId() === $menuItem['pageId'] ? 'active' : '',
            ];
            $contentMenuMain .= $this->substituteMarkerArray($templateMenu, $ma);
        }

        return $contentMenuMain;
    }


    


    /**
     * @return string
     * @throws Exception
     */
    protected function buildPageContent(): string
    {
        if (!$pageId = $this->App->getPageObject()->getId())    {
            return '';
        }  

        $templatePage = $this->readTemplateFile('page_'.$pageId.'.html');
        $pageContentBuildMethodName = 'buildPageContent_'.$pageId;

        if (!method_exists($this, $pageContentBuildMethodName)) {
            Throw new Exception('View exception: No page content generate method: ::'.$pageContentBuildMethodName.' in object '.get_class($this), 3459832);
        }

        return $this->$pageContentBuildMethodName($templatePage);
    }


    /**
     * @param string $marker
     * @param string $value
     */
    protected function assign(string $marker, string $value): void
    {
        $this->markers[$marker] = $value;
    }


    /**
     * @param string $templateName
     * @return string
     * @throws Exception
     */
    protected function readTemplateFile(string $templateName): string
    {
        if (!file_exists($this->templatesPath . $templateName)) {
            Throw new Exception('Template error - File doesn\'t exist: '.$templateName, 3459835);
        }
        if (!$template = file_get_contents($this->templatesPath . $templateName))    {
            Throw new Exception('Template error - Cannot read file: '.$templateName, 3459836);
        }
        return $template;
    }
    
    
    
    
    /**
     * Display generated messages with class if set 
     */
	public function displayMessages(): string
    {
		$content = '';
		foreach ($this->App->getMessages() as $message) {
			$content .= '<p'.($message[1] ? ' class="'.$message[1].'">':'>') . $message[0] . '</p>';
		}
		return $content;
	}
	
    
    // TEMPLATING

    /**
     * typo3-like standard replace marker method
     * @param string $subject
     * @param array $markerArray
     * @return string
     */
	function substituteMarkerArray(string $subject, array $markerArray): string
    {
		return str_replace(array_keys($markerArray), array_values($markerArray), $subject);
	}

	
	
    /**
     * @return string
     */
    public function getOutput(): string
    {
        return $this->output;
    }
    
}


