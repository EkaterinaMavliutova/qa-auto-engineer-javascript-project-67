install:
	npm ci

publish:
	npm publish --dry-run

test-coverage:
	npm test -- --coverage --coverageProvider=v8

test:
	npm test

testWithDebug:
	DEBUG=nock.* npm test

lint:
	npx eslint .