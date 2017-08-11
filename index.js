/**
 * The Node.js XML Parser Olympics
 * (Xml to Js Parser tests)
 * @author Sander Steenhuis <info@redsandro.com> (http://www.Redsandro.com/)
 * @created 2015-08-28
 * @modified 2017-03-14
 */
'use strict'

const testCount	= 8

const path		= require('path')
const fs		= require('fs')
const Promise	= require('bluebird')
const present	= require('present')
const args		= require('command-line-args')([{name: 'markdown', alias: 'm', type: Boolean}])
const pkg		= require('./package.json')
const timings	= {}
const writeFile = Promise.promisify(require('fs').writeFile)
const xmlDir	= path.join(__dirname, 'xml')
const xmlFiles	= fs.readdirSync(xmlDir).reduce((list, item) => {
	let itemPath	= path.join(xmlDir, item)
	if (fs.statSync(itemPath).isFile() && item.match(/\.xml$/)) list[item] = fs.readFileSync(itemPath)
	return list
}, {})

const xml2js	= require('xml2js')
const xml2jsPar	= new xml2js.Parser({explicitArray: false, explicitRoot: false, attrkey: '@'})
const xml2jsPrm	= Promise.promisify(xml2jsPar.parseString)
const xml2json	= require('xml2json')
const x2je		= require('xml2js-expat')
const rapidx2j	= require('rapidx2j')
const nkit		= require('nkit4nodejs')

var tests = {
	x2je: {
		name	: 'xml2js-expat',
		desc	: 'Simple XML to JavaScript object converter using node-expat',
		author	: 'Poetro',
		url		: 'https://github.com/Poetro/node-xml2js-expat',
		test	: xml => new Promise((resolve, reject) => {
			let parser = new x2je.Parser()
			parser.on('end', resolve)
			parser.on('error', reject)
			parser.parse(xml)
		})
	},

	rapidx2j	: {
		name	: 'rapidx2j',
		desc	: 'RapidXML based XML to JSON converter for Node.JS :warning:',
		author	: 'damirn',
		url		: 'https://github.com/damirn/rapidx2j',
		test 	: xml => rapidx2j.parse(xml.toString(), {
			attr_group	: true,
			attr_prefix	: '@',
			empty_tag_value: null,
			parse_boolean_values: false,
			parse_int_numbers: false,
			parse_float_numbers: false,
			preserve_case: true,
			skip_parse_when_begins_with: '',
			value_key: 'keyValue'
		})
	},

	xml2js: {
		name	: 'xml2js',
		desc	: 'XML to JavaScript object converter',
		author	: 'Leonidas-from-XIV',
		url		: 'https://github.com/Leonidas-from-XIV/node-xml2js',
		test	: xml => xml2jsPrm(xml)
	},

	xml2json: {
		name	: 'xml2json',
		desc	: 'Converts XML to JSON using node-expat :warning:',
		author	: 'buglabs',
		url		: 'https://github.com/buglabs/node-xml2json',
		test	: xml => xml2json.toJson(xml, {
			object: true,
			// coerce: true
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
				trim	: true,
				attrkey	: '@',
				textkey	: '_'
			})
			builder.feed(xml)
			return builder.end()
		}
	}
}



if (args.markdown) {
	console.log('`node . --markdown | tee README.md`')
	console.log()
	console.log('---')
	console.log()
}
console.log('Node.js XML to JS Olympics')
console.log('==========================')
console.log()

Promise.resolve(Object.keys(tests))
.then(doTests)
.then(rankings)

function doTests(modules) {
	if (!modules.length) return
	let key		= modules.shift()
	let test	= tests[key]
	let name	= test.name
	let version	= pkg.dependencies[name]
	let desc	= test.desc
	let author	= test.author
	let url		= test.url
	let iteration = 0

	if (args.markdown) {
		console.log(`[\`${name}\` v${version}](${url})`)
		console.log('------------')
		console.log(`_${desc}_ by @${author}`)
	}
	else {
		console.log(`Testing ${name} v${version} by @${author}`)
	}
	console.log()

	return Promise.resolve({name: key, iteration})
	.then(runTest)
	.then(xml => writeFile(path.join(__dirname, `RESULT_${key}.json`), JSON.stringify(xml, null, 2)))
	.tap(() => console.log())
	.then(() => doTests(modules))
}

function runTest(options) {
	let name	= options.name
	let timing	= 0
	let now		= present()
	timings[name] = timings[name] || 0
	return Promise.resolve(tests[name].test(xmlFiles['soccer.xml']))
	.tap(() => args.markdown ?
		console.log(`\`${name}\` (${++options.iteration}):`, parseInt(timing = present() - now, 10), 'ms  ') :
		console.log(`${name} (${++options.iteration}):`, parseInt(timing = present() - now, 10), 'ms  ')
	)
	.tap(() => timings[name] += timing)
	.then(xml =>
		options.iteration < testCount ?
			runTest(options) :
			args.markdown ?
				!console.log('**Average:', parseInt(timings[name] = timings[name] / testCount, 10), 'ms**  ') :
				!console.log('Average:', parseInt(timings[name] = timings[name] / testCount, 10), 'ms  ')
		&& xml)
}

function rankings() {
	let rank = 0
	console.log('Rankings')
	console.log('========')
	console.log()
	console.log('name      | rank | ms')
	console.log('--------- | ---- | ---')
	Object.keys(tests).sort((a, b) => timings[a] > timings[b]).forEach(name => {
		console.log(name + new Array(10 - name.length).join(' '), '|', ++rank, '   |', parseInt(timings[name], 10), 'ms')
	})
	console.log()
}
