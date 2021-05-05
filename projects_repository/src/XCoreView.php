<?php

/**
 * General View object
 */
class XCoreView  {

    const TYPE__BASE = 'base';
    const TYPE__PAGE = 'page';
    const TYPE__WIDGET = 'widget';

    /**
     * @var string View type - just in case, set if we are on Page view or Widget view
     */
    protected $type = '';

    /**
     * @var string View generated output
     */
    protected $output = '';

    /**
     * @var string Template
     */
    protected $template = '';

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


    /**
     * XCoreView constructor.
     * @param string $type ::TYPE__BASE|::TYPE__PAGE|::TYPE__WIDGET
     */
    public function __construct(string $type)
    {
        $this->App = XCore::App();
        $this->templatesPath = PATH_site . rtrim(
            (XCoreUtil::getConfVar('templatesPath') ?? 'templates')
                , '/').'/';
    }





    /**
     * @param string $marker Without ###
     * @param string $value
     * @param string $wrap Add auto prefix and suffix to marker string
     */
    public function assign(string $marker, string $value, string $wrap = '###'): void
    {
        $marker = XCoreUtil::markerName($marker, $wrap);
        $this->markers[$marker] = $value;
    }

    /**
     * @param array $markers As key => value pairs  (Without ###)
     * @param string $wrap Add auto prefix and suffix to marker string
     */
    public function assignMultiple(array $markers, string $wrap = '###'): void
    {
        foreach ($markers as $marker => $value) {
            $this->assign($marker, $value, $wrap);
        }
    }



    /**
     * @param string $fileName
     * @return string
     * @throws Exception
     */
    protected function readTemplateFile(string $fileName): string
    {
        if (!file_exists($this->templatesPath . $fileName)) {
            Throw new Exception('Template error - File doesn\'t exist: '.$fileName, 3459835);
        }
        if (!$template = file_get_contents($this->templatesPath . $fileName))    {
            Throw new Exception('Template error - Cannot read file: '.$fileName, 3459836);
        }
        return $template;
    }


    /**
     * Read and sets the template for the current View
     * @param string $templateName Template name (not filename)  
     * @return void
     * @throws Exception
     */
    public function setTemplate(string $templateName): void
    {
        $fileName = $templateName . '.html';
        $this->template = $this->readTemplateFile($fileName);
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
     * Compile the body to output
     */
    public function render(): void
    {
        $this->output = $this->substituteMarkerArray($this->template, $this->markers);
    }
	
	
    /**
     * @return string
     */
    public function getOutput(): string
    {
        return $this->output;
    }
    
}


