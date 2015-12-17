// Install the package in your application
var fs = require('fs'),
	copy = require('copy'),
	output = false,
	outputDirs = ['../../_libs', '../../libs'];

for ( var i in outputDirs ) if ( outputDirs.hasOwnProperty(i) )
{
	try
	{
		if ( fs.lstatSync(outputDirs[i]).isDirectory() )
		{
			output = outputDirs[i];

			break;
		}
	}
	catch (e)
	{
		// Ignore errors
	}
}

if ( output !== false )
{
	copy('src/*.js', output + '/js_sqlite_eloquent', function ()
	{
		console.info('Install completed!');
	});
}
else
{
	console.error('Could not install to the default directories. Please copy src files manually!');
}