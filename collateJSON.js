//this file takes our individual content/*.json files and concatenates them into one large json file.

//ARGS: folder to watch , [file_to_ignore, file_to_ignore, [...] ]


//SETUP NODE
var util = require('util'),
	fs = require('fs');

//SETUP FILE
var watch_folder,
	watch_folder_name,
	output_file,
	ignore_list,
	watch_files,
	//our functions:
	createWatchList,
	combineOnChange;
	

//ensure a trailing slash
watch_folder = (function(){	
	//process.argv[0] is always 'node' & process.argv[1] is always the filename
	//so process.argv[2] is where we expect our watch folder to be specified
	var folder = process.argv[2];
	return ( folder.charAt( folder.length -1 ) === '/' ) ? folder : folder + '/';
})();

//get the name of our folder
watch_folder_name = (function(){	
	var path_sections = watch_folder.split('/');
	return path_sections[ path_sections.length - 2];
})();

//construct the path to the output file
output_file = watch_folder.replace(watch_folder_name + '/', '') + watch_folder_name + '.json';

//return array of files to ignore
ignore_list = (function(){
	var to_ignore = [];
	process.argv.forEach(function(val,index){
		if( index > 2){ to_ignore.push( val ); }
	});
	return to_ignore; 
})();

//FUNCTIONS
createWatchList = function( all, ignore ){
		var list = [];
		//exclude requested ignore files
		all.forEach( function( filename, index ){
			var ignore_this = false;
			ignore.forEach(function( ignore_name ){
				if( ignore_name === filename){ 
					ignore_this = true;					
				}
			});

			if( !ignore_this ){
				list.push( filename );
			}
		});

		return list;

};

combineOnChange = function( folder ){
	//get the files
	var all_files = fs.readdirSync( folder );	
	watch_files = createWatchList( all_files, ignore_list );

	watch_files.forEach( function( filename, index ){
		fs.watch( watch_folder + filename, function( event ){	
			//update our output on changes to the file contents
			if( event === 'change'){ 
				console.log( 'Change in "' + watch_folder + filename +'", writing to ' + output_file);
				var buffer = [],
					bufferJSON;
				watch_files.forEach( function( file_to_read ){
					var contents = fs.readFileSync( watch_folder + file_to_read, 'ascii' ),
						contentsJSON;
					try{
						var contentsJSON = JSON.parse( contents );
					} catch( e ){
						util.error( 'ERROR: ' + file_to_read + ' is not valid JSON' );
					}
					buffer.push( contentsJSON );
				});
				bufferJSON = JSON.stringify( buffer );
				fs.writeFileSync( output_file, bufferJSON, 'ascii' );
			}
		});
	});
};

//BEGIN

//check that our requested watch folder exists
fs.exists( watch_folder, function( exists ){
	if( exists ){
		combineOnChange( watch_folder );
	} else {
		util.error( 'ERROR: The requested watch directory "' + watch_folder + '" does not exist.' );
	}
});


