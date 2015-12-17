// Install the package in your application
var fs = require('fs'),
	copy = require('copy'),
	path = require('path'),
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
	copy.one('install/ignore_git', output + '/js_sqlite_eloquent', {
		rewrite: function ( fp, dest )
		{
			return path.resolve(dest, '.gitignore');
		}
	}, function ()
	{
		copy('src/*.js', output + '/js_sqlite_eloquent', function ()
		{
			console.info('Install completed!');
		});
	});
}
else
{
	console.error('Could not install to the default directories. Please copy src files manually!');
}