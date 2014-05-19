function Database()
{
	this.name = 'DatabaseName';
	this.bgType = 1;

	return this;
}

Database.prototype.initialize = function (callback)
{
	var _this = this;

	if ( typeof callback === 'undefined' )
	{
		callback = function ()
		{
		};
	}

	// Database initialized
	// You can run any install scripts you want in the given callback, or leave it empty
	return window.sqlitePlugin.openDatabase({name: this.name, bgType: this.bgType}, callback, function ()
	{
		console.log('Could not initialize the database ' + _this.name);
	});
};