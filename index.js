/**
 * The Node.js XML Parser Olympics
 * (Xml to Js Parser tests)
 * @author Sander Steenhuis <info@redsandro.com> (http://www.Redsandro.com/)
 * @created 2015-08-28
 * @modified 2017-03-12
 */
'use strict'

const testCount	= 6

const path		= require('path')
const util		= require('util')
const fs		= require('fs')
const Promise	= require('bluebird')
const present	= require('present')
const timings	= {}
const writeFile = Promise.promisify(require('fs').writeFile)
const xmlDir	= path.join(__dirname, 'xml')
const xmlFiles	= fs.readdirSync(xmlDir).reduce((list, item) => {
	let itemPath	= path.join(xmlDir, item)
	if (fs.statSync(itemPath).isFile() && item.match(/\.xml$/)) list[item] = fs.readFileSync(itemPath)
	return list
}, {})

const xml2js	= require('xml2js')
const xml2jsPar	= new xml2js.Parser({explicitArray: false, explicitRoot: false})
const xml2jsPrm	= Promise.promisify(xml2jsPar.parseString)
const xml2json	= require('xml2json')
const x2je		= require('xml2js-expat')
const rapidx2j	= require('rapidx2j')
const nkit		= require('nkit4nodejs')

var tests = {
	x2je: {
		name	: 'node-xml2js-expat',
		desc	: 'Simple XML to JavaScript object converter using node-expat',
		author	: 'Poetro',
		url		: 'https://github.com/Poetro/node-xml2js-expat',
		test	: xml => new Promise((resolve, reject) => {
			let json, parser = new x2je.Parser((result, error) => json = result)
			if (parser.parseString(xml)) resolve(json)
			else reject(new Error(util.format('node-xml2js-expat: parse error: "%s"', parser.getError())))
		})
	},

	rapidx2j	: {
		name	: 'rapidx2j',
		desc	: 'RapidXML based XML to JSON converter for Node.JS :warning:',
		author	: 'damirn',
		url		: 'https://github.com/damirn/rapidx2j',
		test 	: xml => rapidx2j.parse(xml.toString())
	},

	xml2js: {
		name	: 'node-xml2js',
		desc	: 'XML to JavaScript object converter',
		author	: 'Leonidas-from-XIV',
		url		: 'https://github.com/Leonidas-from-XIV/node-xml2js',
		test	: xml => xml2jsPrm(xml)
	},

	xml2json: {
		name	: 'node-xml2json',
		desc	: 'Converts XML to JSON using node-expat :warning:',
		author	: 'buglabs',
		url		: 'https://github.com/buglabs/node-xml2json',
		test	: xml => xml2json.toJson(xml, {
			object: true
		})
	},

	nkit: {
		name	: 'nkit4nodejs',
		desc	: 'nkit C++ library port to Node.js',
		author	: 'eye3',
		url		: 'https://github.com/eye3/nkit4nodejs',
		test	: (xml) => {
			var builder = new nkit.AnyXml2VarBuilder({
				explicit_array: false,
				trim: true,
				attrkey: '@',
				textkey: '_'
			})
			builder.feed(xml)
			return builder.end()
		}
	}
}



console.log('`node . | tee README.md`')
console.log()
console.log('---')
console.log()
console.log('Node.js XML to JS Olympics')
console.log('==========================')
console.log()

Promise.resolve(Object.keys(tests))
.then(doTests)
.then(rankings)

function doTests(modules) {
	if (!modules.length) return
	let name = modules.shift()
	let iteration = 0

	console.log(`[\`${tests[name].name}\`](${tests[name].url})`)
	console.log('------------')
	console.log(`_"${tests[name].desc}"_ by @${tests[name].author}`)
	console.log()

	return Promise.resolve({name, iteration})
	.then(test)
	.then(xml => writeFile(path.join(__dirname, `RESULT_${name}.json`), JSON.stringify(xml, null, 2)))
	.tap(() => console.log())
	.then(() => doTests(modules))
}

function test(options) {
	let name = options.name
	let timing = 0
	timings[name] = timings[name] || 0
	let now = present()
	return Promise.resolve(tests[name].test(xmlFiles['soccer.xml']))
	.tap(() => console.log(`\`${name}\` (${++options.iteration}):`, parseInt(timing = present() - now, 10), 'ms  '))
	.tap(() => timings[name] += timing)
	.then(xml => options.iteration < testCount ? test(options) : !console.log('**Average:', parseInt(timings[name] = timings[name] / testCount, 10), 'ms**  ') && xml)
}

function rankings() {
	let rank = 0
	console.log('Rankings')
	console.log('========')
	console.log()
	console.log('name | rank | ms')
	console.log('---- | ---- | ---')
	Object.keys(tests).sort((a, b) => timings[a] > timings[b]).forEach(name => {
		console.log(name, '|', ++rank, '|', parseInt(timings[name], 10), 'ms')
	})
	console.log()
}
