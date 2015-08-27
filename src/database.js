/**
 *
 * @constructor
 */
var Database = function()
{
	this.db = window.openDatabase('DatabaseName', '1.0', '', (5 * 1024 * 1024));

	this.getDatabase = function()
	{
		return this.db;
	};

	return this;
};