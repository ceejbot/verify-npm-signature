# verify-npm-signature

Verify the npm registry's pgp signature for a package version, one stop shopping edition. This tool requires that you have the [Keybase command-line tool](https://keybase.io/download) already installed.

Usage:

	npx verify-npm-signature esm@3.0.48
	verify-npm-signature lodash@4.17.10
	vns @slack/client@4.3.1

Note that many older packages don't have signatures yet, so the lack of a signature does not *yet* indicate anything is wrong.

## LICENSE

ISC.
