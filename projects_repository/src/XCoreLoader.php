<?php

/**
 * Loader for classes and objects (object manager with classname recognition and autoload)
 * 
 * NOTE - This class is not supposed to be called in original, only from your local App's Loader extension class!
 * 
 * Class XCoreLoader
 */
abstract class XCoreLoader   {
    

    /**
     * Define replacement classes in your app's Loader
     * 'SomeClass' => 'InstantiateThisOneInstead'
     * 
     * Note, that it also tries to load all of them, expecting them: "SomeClass" in SRC dir, and "InstantiateThis...." in APP dir!
     */
    const XCLASS_MAP = [];



    

    /**
     * Put all php includes into this implementation
     * 
     * @return void
     */
    static public function includeClasses(): void
    {
        self::controlClassCall();
        // first we load interfaces and other XC classes which might be extended / implemented in these next  
        require_once PATH_site . 'src/XCoreSingleton.php';
        require_once PATH_site . 'src/XCore.php';
        require_once PATH_site . 'src/XCorePage.php';
        require_once PATH_site . 'src/XCoreView.php';
        require_once PATH_site . 'src/XCoreViewhelper.php';
        require_once PATH_site . 'src/XCoreViewhelperMenu.php';

        // then all of these configured in override map
        // (is this a good approach? in future we may need to xclass from subdirs, then review if that works or rethink) 
        foreach (static::XCLASS_MAP as $class => $xclass) {
            require_once PATH_site . 'src/' . $class . '.php';
            require_once PATH_site . 'app/' . $xclass . '.php';
        }


        // include static / non-instantiable classes - no autoload like when using ::get() in this case is possible
        require_once PATH_site . 'src/XCoreUtil.php';
        @include_once PATH_site . 'app/Util.php';
    }





    /**
     * Get an instance of given class or its xclass (replacement extension class) instead, if configured.   
     *
     * @param string $className Class name, mut not start with a backslash
     * @param array<int, mixed> $constructorParams Arguments for the constructor
     * @return object The created instance
     */
    static public function get(string $className, ...$constructorParams): object
    {
        self::controlClassCall();
        if (!is_string($className) || empty($className)) {
            throw new \InvalidArgumentException('get() parameter error - $className is empty!', 573475);
        }
        // cleanup class name
        $className = ltrim($className, '\\');

        static::tryAutoInclude($className);
        if (isset(static::XCLASS_MAP[$className])) {
            $finalClassName = static::XCLASS_MAP[$className];
            static::tryAutoInclude($finalClassName);
        } else {
            $finalClassName = $className;
        }
        // tbd: maybe also try to include default child class from app/ (trim "XCore" from classname). or better leave it configured 

        // Return singleton instance if it is already registered
        if (isset(static::$singletonInstances[$finalClassName])) {
            return static::$singletonInstances[$finalClassName];
        }

        $instance = new $finalClassName(...$constructorParams);
        // Register new singleton instance
        if ($instance instanceof XCoreSingleton) {
            static::$singletonInstances[$finalClassName] = $instance;
        }
        return $instance;
    }


    /**
     * @param string $className
     */
    protected static function tryAutoInclude(string $className): void
    {
        if ($className  &&  !class_exists($className))  {
            if (file_exists(PATH_site.'app/'.$className.'.php'))    {
                include_once PATH_site.'app/'.$className.'.php';
            }
            if (file_exists(PATH_site.'src/'.$className.'.php'))    {
                include_once PATH_site.'src/'.$className.'.php';
            }
        }
    }
    
    
    /**
     * Singleton instances
     *
     * @var array<XCoreSingleton>
     */
    protected static $singletonInstances = [];


    /**
     * Avoid calling this class statically using original name - it's an abstract class, but with static it doesn't prevent
     * one from just calling any static method from it, which sometimes cause problems. So this does the trick.
     * @throws Exception
     */
    static private function controlClassCall(): void
    {
        if (static::class === 'XCoreLoader')    {
            //debug_print_backtrace();
            Throw new Exception('XCORE EXCEPTION: Wrong use of XCoreLoader::... ! Don\'t call it directly, use your Loader:: instead', 8453458);
        }
    }
}
