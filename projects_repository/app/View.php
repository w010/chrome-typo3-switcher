<?php




class View extends XCoreView  {

    
    
    // custom: 


    /**
     * @param string $template
     * @return string
     */
    protected function buildPageContent_home(string $template): string
    {
        $ma = [
            '###STATUS###' => '<b class="level-success">UP</b>',
            '###REPO_VERSION###' => REPO_VERSION,
            '###REPO_APP_VERSION###' => REPO_APP_VERSION,
        ];

        return $this->substituteMarkerArray($template, $ma);
    }
    
    
    /**
     * Display generated messages with class if set 
     */
	public function displayMessages(): string
    {
		$content = '';
		foreach ($this->App->getMessages() as $message) {
		    // override class
			$content .= '<p'.($message[1] ? ' class="level-'.$message[1].'">':'>') . $message[0] . '</p>';
		}
		return $content;
	}

}


