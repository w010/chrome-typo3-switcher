<?php




class Page extends XCorePage  {


    /**
     * @return string
     * @throws Exception
     */
    protected function buildPageContent_home(): string
    {
        $markers = [
            'STATUS' => '<b class="level-success">UP</b>',  // may be disabled / maintenance / smth
            'REPO_VERSION' => REPO_VERSION,
            'REPO_APP_VERSION' => REPO_APP_VERSION,
        ];
        
        $this->View->assignMultiple($markers);
        $this->View->render();

        return $this->View->getOutput();
    }

}


