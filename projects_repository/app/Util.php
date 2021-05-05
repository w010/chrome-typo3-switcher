<?php




class Util extends XCoreUtil {



    /**
     * Read projects and build output. Since they are json files already, glue them together into one json array
     *
     * @param $dataDir
     * @return array
     */
	static public function getProjects($dataDir): array
    {
		$filter = self::cleanInputVar($_GET['filter']);
		
		$projectsAll = [];
		$projectsFiltered = [];

		if (is_dir($dataDir)) {

	        foreach (scandir($dataDir) as $file) {
	        	
	            if (substr($file, 0, 1) != '.'  &&  substr($file, -5, 5) === '.json') {
		            // read file content
		            $fileContent = file_get_contents($dataDir . '/' . $file);
		            $fileParsedArray = @json_decode($fileContent, true);

		            // allow both: files with single project, as single json object / json starting with {
		            // and files with array of projects / json starting with [{
		            // merge them all together
		            // todo: detect and mark uuid duplicates

		            if (preg_match('/^\[/', trim($fileContent)))    {
		            	$projectsAll = array_merge($projectsAll, $fileParsedArray);
		            }
		            else    {
		            	$projectsAll[] = $fileParsedArray;
		            }
	            }
		    }
		}

		foreach ($projectsAll as $project) {

			// ignore this field, don't import, don't compare
			unset ($project['sorting']);

			// search
			if ($filter) {
				// search for string occurrence in name
				if (stristr($project['name'], $filter))    {
                    $projectsFiltered[] = $project;
	            }
	            else    {
	                // search in merged array of contexts & links, in names and urls
	                foreach (array_merge((array)$project['contexts'], (array)$project['links']) as $testItem)  {
	                    if (stristr($testItem['name'], $filter))    {
	                        $projectsFiltered[] = $project;
	                        break;
			            }
	                    else if (stristr($testItem['url'], $filter))    {
	                        $projectsFiltered[] = $project;
	                        break;
			            }
		            }
	            }
			}
			else    {
				$projectsFiltered[] = $project;
			}
		}
		return $projectsFiltered;
	}


}


