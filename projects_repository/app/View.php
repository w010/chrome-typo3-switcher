<?php




class View extends XCoreView  {

    
    
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


