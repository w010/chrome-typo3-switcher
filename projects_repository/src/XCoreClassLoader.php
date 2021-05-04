<?php


abstract class XCoreClassLoader   {
    

    /**
     * 'SomeClass' => 'InstantiateThisOneInstead'
     */
    const XCLASS_MAP = [];



    

    /**
     * Put all php includes into this implementation
     * 
     * @return void
     */
    public function includeClasses(): void
    {
        require_once PATH_site.'src/XCore.php';
    }





    /**
     * Get an instance of given class or its xclass (replacement extension class) instead, if configured.   
     *
     * @param string $className Class name, mut not start with a backslash
     * @param array<int, mixed> $constructorParams Arguments for the constructor
     * @return object The created instance
     */
    public static function makeInstance(string $className, ...$constructorParams): object
    {
        if (!is_string($className) || empty($className)) {
            throw new \InvalidArgumentException('makeInstance() parameter error - $className is empty!', 573475);
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

        // Create new instance and call constructor with parameters
        return new $finalClassName(...$constructorParams);
    }


    /**
     * @param string $className
     */
    protected static function tryAutoInclude(string $className): void
    {
        if (!class_exists($className))  {
            if (file_exists(PATH_site.'app/'.$className.'.php'))    {
                include_once PATH_site.'app/'.$className.'.php';
            }
            if (file_exists(PATH_site.'src/'.$className.'.php'))    {
                include_once PATH_site.'src/'.$className.'.php';
            }
        }
    }
    
    
    
    
    
    
    /**
     * Singleton pattern
     * @var XCoreClassLoader|null
     */
    static protected $_instance = null;

    /**
     * Get Loader instance
     */
    static public function getLoader(): self
    {
        if (!static::$_instance)   {
            $className = static::class;
            static::$_instance = new $className();
        }
        return static::$_instance;
    }

    protected function __construct() {}

}
