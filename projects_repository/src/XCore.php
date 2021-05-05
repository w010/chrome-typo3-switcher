<?php

const XCORE_VERSION = '0.1.994-dev';




/**
 * XCore - Simple Standalone App Engine
 * @author wolo.pl '.' studio
 */
abstract class XCore  {

    /**
     * Optional local app config path
     */
    const CONFIG_FILE = 'config/app_config.php';



    /**
     * Initial XCore settings - override in child class
     * @var array 
     */
    protected $defaultSettingsXCore = [

        'baseHref' => '',

        'dontExecCommands' => 0,    // only build and collect clis

        'dbAuth' => [
            'user' => '',
            'password' => '',
            'host' => '',
            'dbname' => ''
        ],

        // pages available to render
        'pages' => [
            // 'PAGE_ID' => ['title' => 'PAGE TITLE'] 
            'home' =>     ['title' => 'Home'],    
            //'example' =>  ['title' => 'Example subpage'],    
        ],

        // menu config 
        'menuMain' => [
            // item ref:    'href' => [ (optional) URL ],
            //              'pageId' => [ (optional) PAGE_ID from pages ],
            //              'title' => [ (optional) when using pageId, takes title from pages ]   ],
            ['pageId' => 'home'],    
            //['pageId' => 'example'],
        ],
    ];


    /**
     * General App configuration, to be set in child classes. During init these arrays are merged: $settingsDefaultXCore + $settingsDefaultApp + $settingsLocal
     * @var array 
     */
	protected $defaultSettingsApp = [];


    /**
     * Final working configuration to read settings from
     * @var array
     */
    protected $settings = [];



    /**
     * Is this run an ajax call?
     * (for this to work, call xhr with: headers: {'XCore-Request-Type': 'Ajax',},
     * /one sure way to detect xhr call is to just pass that info by yourself)
     * @var bool
     */
    protected $isAjaxCall = false;

    /**
     * Message/error to show
     * @var array 
     */
	protected $messages = [];
	
        /**
         * // todo: decide to keep it here or not
         * Stored commands to show and/or execute
         * @var array 
         */
        public $cmds = [];

	// input values / gp
    protected $vars = [];

	// action requested
	protected $action = '';

	protected $actionsAvailable = [];

	// database connection
	protected $dbConnection = null; 

    // pages available to render. usually set through settings/config
    // example:   'home' => ['title' => 'Home'],
    protected $pages = [];
    
    // menu to build from these pages or custom urls 
    protected $menuMain = [];
    
    /**
     * Page object
     * @var XCorePage|null 
     */
	protected $Page = null;
	
	/**
     * View object
     * @var XCoreView|null 
     */
	protected $View = null;

	/**
     * Util object
     * @var XCoreUtil|null 
     */
	protected $Util = null;
    
        /**
         * Contents collection to output
         * @var array 
         */
        public $content = [];




	public function __construct()
    {
	    $this->configure();
	    $this->init();
	}
	
	
	protected function configure()
    {
	    // set config
        $localConfig = [];
        if (file_exists(self::CONFIG_FILE))   {
            $localConfig = @include_once(self::CONFIG_FILE);
        }
        $this->settings = array_merge($this->defaultSettingsXCore, $this->defaultSettingsApp, (array) $localConfig);


	    // todo later: validate pages / menu config
	    $this->pages = $this->settings['pages'];
	    $this->menuMain = $this->settings['menuMain'];
    }


    /**
     * In most cases it should be able to be called in any App, without any interferences
     * So no need to override this with custom code 
     */
    protected function init()
    {
	    $this->isAjaxCall = isset($_SERVER['HTTP_XCORE_REQUEST_TYPE']) && strtolower($_SERVER['HTTP_XCORE_REQUEST_TYPE']) === 'ajax';
	    $this->Util = ClassLoader::makeInstance(XCoreUtil::class, $this);

	    // optional, connects if finds config
	    $this->dbConnection = $this->Util->databaseConnect();
	    
	    
        // init & sanitize input

        $this->action = XCoreUtil::cleanInputVar($_GET['action']);
	    // clean this value after use, to prevent potential including this var in built urls - it's purpose is single-use
		unset($this->vars['action']);

        // page and view
		$this->vars['p'] = XCoreUtil::cleanInputVar($_GET['p']);
        
	    $this->Page = ClassLoader::makeInstance(XCorePage::class, $this, $this->vars['p']);
        $this->View = ClassLoader::makeInstance(XCoreView::class, $this, $this->Page);
    }

    
    
    /**
     * Get configuration option value
     * @param $varName
     * @return mixed|null
     */
	public function getConfVar($varName)
    {
	    return $this->settings[$varName] ?? null;
    }
    
    /**
     * Get full configuration
     * @return array
     */
	public function getSettings()
    {
	    return $this->settings;
    }
    



    /**
     * Run action
     * @throws Exception
     */
	protected function runAction()
    {
        if ($this->action && in_array($this->action, $this->actionsAvailable)) {
            $this->msg('- Action called: ' . $this->action, 'text-info');
            $actionMethodName = "action_{$this->action}";
            if (!method_exists($this, $actionMethodName))  {
                throw new Exception('Action set as available, but no method named: '.$actionMethodName, 564573);
            }
            $this->$actionMethodName();
        }
        else {
            $this->sendContent([
                'success' => false,
                'result' => [],
                'code' => 'action_not_found',
                'error' => 'Action not found or unavailable'
            ]);
        }
	}


    	

	/**
	 * Output xhr or html body
	 * @param array $response Response data to include in output (both ajax and frontend)
	 */
	protected function sendContent($response = [])
    {
	    if ($this->isAjaxCall)  {
            header('Content-type:application/json;charset=utf-8');
            print json_encode($response, JSON_PRETTY_PRINT);
        }
	    else    {
	        $this->View->buildContent($response);
	        print $this->View->getOutput();
        }
        exit;
	}





	/**
     * MAIN RUN
     */
    public function handleRequest()
    {
		// control access here if needed

		if ($this->action) {
		    $this->runAction();
        }

        $this->sendContent();
	}
	

	
	
	
	
	
	// RUN HELPERS


	/**
	 * Add message/notice
     * 
	 * @param string $message
	 * @param string $class - class for notice p, may be error or info
	 * @param string $index - index can be checked in tag markup, to indicate error class in form element
	 */
    public function msg($message, $class = '', $index = ''): void
    {
		if ($index)  $this->messages[$index] = [$message, $class];
		else         $this->messages[] = [$message, $class];
	}


	
	/**
	 * Get collected messages
     * @return array
	 */
    public function getMessages(): array
    {
		return $this->messages;
	}


    /**
	 * Get available pages
     * @return array
	 */
    public function getPages(): array
    {
		return $this->pages;
	}

	/**
	 * Get Page object
     * @return XCorePage
     */
    public function getPageObject(): XCorePage
    {
		return $this->Page;
	}

	/**
	 * Get menu config
     * @return array
	 */
    public function getMenuMain(): array
    {
		return $this->menuMain;
	}


	/**
	 * Get menu config
	 */
    public function getDbConnection(): ?mysqli
    {
		return $this->dbConnection;
	}





	


    // SHORT


    /**
     * Get uri with query part
     * 
     * @param string $link
     * @param array $params
     * @param bool $keepCurrentVars
     * @return string
     */
	public function linkTo(string $link, array $params, bool $keepCurrentVars = false): string
    {
		if ($keepCurrentVars)	{
			$params = array_merge($this->vars, $params);
		}

		return XCoreUtil::linkTo($link, $params);
	}
}
