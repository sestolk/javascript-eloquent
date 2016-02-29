"use strict";

class EloquentHelpers {
	/**
	 * Check if given value is a function
	 *
	 * @param {string} val
	 * @returns {boolean}
	 */
	static isFunction(val)
	{
		return (typeof val === 'function' && val !== null);
	}

	/**
	 * Check if the given value is defined
	 *
	 * @param val
	 * @returns {boolean}
	 */
	static isDefined(val)
	{
		return (typeof val !== 'undefined' && val !== null);
	}

	/**
	 * Check if the given value is an array
	 * @param val
	 * @returns {boolean}
	 */
	static isArray(val)
	{
		return Object.prototype.toString.call(val) === '[object Array]';
	}

	/**
	 * Converts a string foo_bar to FooBar
	 *
	 * @param str
	 * @returns {string}
	 */
	static toStudlyCase(str)
	{
		let arr = str.split('_');

		return arr.map(function (str)
		{
			return str.charAt(0).toUpperCase() + str.slice(1);
		}).join('');
	}
}

class QueryIterator {
	constructor()
	{

	}
}

class QueryRelations {
	constructor()
	{
	}
}

class QueryBuilder extends QueryRelations {
	constructor()
	{
		super();

		this.values = [];
		this.whereQuery = '';
	}

	setWhereQuery(query)
	{
		this.whereQuery += query;

		return this.whereQuery;
	}

	setValues(column, val)
	{
		let fn = this['set' + EloquentHelpers.toStudlyCase(column) + 'Attribute'];
		if ( EloquentHelpers.isFunction(fn) )
		{
			val = fn(val);
		}

		this.values.push(val);

		return this.values;
	}

	/**
	 *
	 * @param {string} column
	 * @param {string|Array} [operator='=']
	 * @param {string|Array} [val=]
	 * @param {string} [boolean='AND']
	 */
	where(column, operator, val, boolean)
	{
		if ( !val )
		{
			val = operator;
			operator = '=';
		}
		operator = operator || '=';
		boolean = boolean || 'AND';

		if ( EloquentHelpers.isFunction(column) )
		{
			return this.whereNested(column, boolean);
		}

		this.setWhereQuery(column + ' ' + operator + ' ?');
		this.setValues(column, val);

		return this;
	}

	whereNested()
	{
		return this;
	}

	select()
	{

	}

	create()
	{

	}
}

class Eloquent extends QueryBuilder {
	constructor()
	{
		super();

		this.table = '';
		this.db = null;
	}

	/**
	 *
	 * @param {Database} [db=]
	 */
	set database(db)
	{
		this.db = db || app.db;
	}

	first()
	{

	}

	get()
	{

	}

	all()
	{

	}

	raw()
	{

	}

	remove()
	{

	}

	empty()
	{

	}

	drop()
	{

	}
}

class MarketModel extends Eloquent {
	constructor()
	{
		super();

		this.table = 'markets';
	}

	setTitleAttribute(val)
	{
		return val + ' Sven';
	}
}

var market = new MarketModel();

market.where('title', 'test').first();