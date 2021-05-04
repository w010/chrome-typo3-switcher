<?php
		


class XCorePage  {
    
    protected $id = '';
    protected $title = '';

    /**
     * @var XCore|object
     */
    protected $XCore;


    public function __construct(XCore $XCore, $id = '')
    {
        $this->XCore = $XCore;

        $id = preg_replace('/[^a-zA-Z0-9_-]+/', '_', strtolower($id));
        if ($id && !in_array($id, array_keys($this->XCore->getPages()))) {
            die ('Error - Invalid page value: ' . $id);
        }

        $this->id = $id;
        if (!$this->id) {
            $this->id = 'home';
        }

        $this->title = $this->XCore->getPages()[$this->id]['title'];
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
}


