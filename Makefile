install:
	npm ci

publish:
	npm publish --dry-run

test-coverage:
	npm test -- --coverage --coverageProvider=v8

test:
	npm test

lint:
	npx eslint .