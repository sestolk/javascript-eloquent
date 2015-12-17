/**
 *
 * @constructor
 */
var Database = function ( name )
{
	this.db = window.openDatabase(name, '1.0', '', (5 * 1024 * 1024));

	this.getDatabase = function ()
	{
		return this.db;
	};

	return this;
};