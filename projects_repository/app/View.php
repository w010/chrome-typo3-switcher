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

}


