#!/usr/bin/env node

'use strict';

const
	CP     = require('child_process'),
	fs     = require('fs'),
	needle = require('needle'),
	path   = require('path'),
	semver = require('semver')
	;

if (process.argv.length < 3)
{
	console.log('Specify a package-version to check: pkgname@version');
	process.exit(1);
}

const target = process.argv[2];
const matches = target.match(/^(@?[^@]+)@(.+)$/);
if (!matches)
{
	console.log('Specify a package-version to check: pkgname@version');
	process.exit(1);
}

const [, pkgname, v] = matches;
const version = semver.clean(v);

// This function only exists because I want to use await.
async function main()
{
	const response = await needle('get', `https://registry.npmjs.org/${encodeURIComponent(pkgname)}`);
	const packument = response.body;

	// And now, a whole lot of conditions to report on & bail from.
	if (!packument.versions)
	{
		console.log('Malformed response from registry; not a packument!');
		process.exit(1);
	}

	const pkgversion = packument.versions[version];
	if (!pkgversion)
	{
		console.log(`Version ${version} not found in ${pkgname}.`);
		process.exit(1);
	}

	if (!pkgversion.dist.integrity)
	{
		console.log(`No integrity field found in ${pkgname}@${version}-- nothing useful to be signed`);
		process.exit(1);
	}

	if (!pkgversion.dist['npm-signature'])
	{
		console.log(`The npm registry has not yet signed ${pkgname}@${version}`);
		process.exit();
	}

	const tmpfile = path.join(process.env.TMPDIR ? process.env.TMPDIR : '/tmp', `${encodeURIComponent(pkgname)}.${version}.sig`);
	fs.writeFileSync(tmpfile, pkgversion.dist['npm-signature']);
	const message = `${pkgname}@${version}:${pkgversion.dist.integrity}`;

	// keybase pgp verify --signed-by npmregistry -d sig-to-check -m 'message'
	const opts = [
		'pgp',
		'verify',
		'--signed-by',
		'npmregistry',
		'-d',
		tmpfile,
		'-m',
		message
	];

	const kb = CP.spawn('keybase', opts, { stdio: 'inherit' });
	kb.on('error', err =>
	{
		console.error(err);
		process.exit(1);
	});

	kb.on('close', code =>
	{
		fs.unlinkSync(tmpfile);
		process.exit(code);
	});
}

main();
