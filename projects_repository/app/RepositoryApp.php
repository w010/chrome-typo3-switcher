<?php
/**
 * Projects Repository app
 * Handy Switcher add-on
 *
 * 
 * BE/FE/Env Handy Switcher (TYPO3 dedicated, but is kind of universal)
 * Great help for integrators with many web projects, that runs on multiple parallel environments/contexts.
 * 
 * 
 * Subpackage: Projects Repository
 *
 * based on XCore version: 0.1.994
 */


// version of repository engine (storage, structure etc)
// - change only when output / communication / repo conf changes
const REPO_VERSION = '0.2.2';

// version of app itself - not interesting to calling api
const REPO_APP_VERSION = '0.3.1';



 /**
 * wolo.pl '.' studio
 * 2017-2021
 * wolo.wolski(at)gmail.com
 * https://wolo.pl/
 * 
 * https://chrome.google.com/webstore/detail/typo3-backend-frontend-ha/ohemimdlihjdeacgbccdkafckackmcmn
 * https://github.com/w010/chrome-typo3-switcher
 * 
 * 
 *
 * This component here is a simple (but fully functional - in basis) draft of Project Repository serverside.
 * The idea is to centralize/keep in-sync company's webprojects urls, to multiple working environments of each,
 * to make sure every developer in team when starting work on a project has always full set of latest and checked set
 * of urls to projects and its servers / instances / stages to lightspeed jumping between them only swapping the domain
 * within one click, without even need to configure your common projects manually to use. Just wait for someone else 
 * do it and fetch ready config ;)
 * 
 * (Ok, maybe it kinda sounds like "wtf, why do I even need something like that, when I can make a bookmark
 * on a browser bar like I do for years" but believe me or not, if you maintain dozens of multidomain webprojects on 
 * automated parallel environments on everyday basis, do every task on different one of them, then integrate changes
 * one-by-one on every stage server and every client has different naming conventions, this one changed domains recently,
 * that one broke subdomains, the other one never documents anything, and this one over there thinks you remember all
 * of urls to all of important-only-to-him subpages on dev, because you worked there, once, for an hour, three months ago...
 * After a few weeks using this you probably won't imagine your work without this plugin anymore.)
 * 
 * You can start to use this script as-is just by putting it somewhere on your webserver (rather http auth protected),
 * upload projects data (as json files, like these exported from Chrome plugin) into /data directory and that's it,
 * basically ready to fetch by your teammates.
 * It may be a good base to write something better, if you need. Ie. as Typo3 plugin and records, using fe_user
 * authentication, or so. (That one might be helpful when I finish push-config-to-repo functionality.)  
 */





// todo:
// send repo version, check on request,
// plus additional error handling on ext side to avoid errors when some trash comes
// htaccess pass




/**
 * Class ProjectsRepository
 */
class RepositoryApp extends XCore  {


    /**
     * Repository config path
     */
    const REPO_CONFIG_FILE = 'config/repo_config.php';


    
    /**
     * Defaults
     * @var array
     */
    protected $defaultSettingsApp = [
        'repo_keys' => [],
        'data_dir' => 'data',

        'pages' => [
            'home' => ['title' => 'Home'],
        ],

        'menuMain' => [],
    ];



    
    protected $actionsAvailable = [
        'fetch', 'push'
    ];
	

    /**
     * @var string
     */
    protected $dataDir = '';


    /*public function getDataDir(): string
    {
        return $this->dataDir;
    }*/

        
    
    /**
     * Util object - update var type
     * @var Util|null 
     */
	protected $Util = null;


    /**
     * Repo access key
     * @var string
     */
	protected $key = '';
	
	/**
     * Repo access level
     * @var string
     */
	protected $accessLevel = 'READ';



    protected function configure()  {
        parent::configure();

        $repoConfig = [];
        if (file_exists(self::REPO_CONFIG_FILE))   {
            $repoConfig = @include_once(self::REPO_CONFIG_FILE);
        }
        $this->settings = array_merge($this->settings, (array) $repoConfig);


        // init & validate setup
        $this->dataDir = $this->settings['data_dir'];
        if (!$this->dataDir)   {
            Throw new Exception('Configuration error! No "data_dir" set', 982634);
        }
    }



    /**
     * Init object
     */
	public function init()
    {
        parent::init();
        // for testing, but no need to control access
        if (!$this->isAjaxCall  &&  $_GET['ajax']) {
            $this->isAjaxCall = true;
        }

        $this->key = XCoreUtil::cleanInputVar($_SERVER['HTTP_SWITCHER_REPO_KEY'] ?? $_GET['key'] ?? '');
    }



	/**
     * MAIN RUN
     */
	public function handleRequest()  {

		// control access

        if ($this->isAjaxCall)  {
            // in case any problems authorizing with valid key, check what XCoreUtil::cleanInputVar does with incoming var
            if ($this->settings['repo_keys']  &&  !in_array($this->key, array_keys($this->settings['repo_keys'])))    {
                $this->sendContent([
                    'success' => false,
                    'result' => [],
                    'code' => 'invalid_key',
                    'error' => 'Unauthorized - invalid repo key'
                ]);
                exit;
            }
            $this->accessLevel = $this->settings['repo_keys'][$this->key] === 'WRITE' ? 'WRITE' : 'READ';

            // todo: catch exception here
            $this->runAction();
        }

        $this->sendContent();
	}
	
	
	/**
	 * Output xhr or html body
	 * @param array $response Response data to include in output (both ajax and frontend)
	 */
	protected function sendContent(array $response = [])
    {
        // todo: to nie moze byc dodawane dopiero tu, powinno byc juz on handlerequest - czyli przekazywac jakos do runAction albo injectowac pozniej. wymyslic na to jakis patent 
        //$response['message'] = ['Repo version lower than requested', 'warn'];
        parent::sendContent($response);
	}

	
	/**
     * Custom action - HANDSHAKE
     */
	protected function action_handshake() {
        $this->sendContent([
            'success' => true,
            'repo_version' => REPO_VERSION,
            'access_level' => $this->accessLevel,
            'result' => 'HELLO',
        ]);
    }
    

    /**
     * Custom action - FETCH
     */
	protected function action_fetch() {
        $this->sendContent([
            'success' => true,
            'repo_version' => REPO_VERSION,
            'access_level' => $this->accessLevel,
            'result' => Util::getProjects($this->dataDir)
        ]);
    }
    
    
    /**
     * Custom action - PUSH
     */
    protected function action_push() {
        die('not implemented yet');
    }


}

