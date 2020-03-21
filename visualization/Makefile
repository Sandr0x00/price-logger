.PHONY: build-css build-js build dist test

build-css:
	sass sass:public/css -s compressed

build-js:
	npm run compile

build: build-css build-js
	./copy.py

test:
	npm test

dist: build test
	./make_dist.py

serve:
	sass sass:public/css -s compressed --watch& node server.js

start:
	node server.js

kill:
	@kill `cat pid`
	@ps -ef | grep "[n]ode server.js"

nohup:
	@nohup node server.js 2>&1 &
	@printf ""
	@tail -n 2 nohup.out
	@cat pid
	@printf "\n"

status:
	ps -ef | grep "[n]ode server.js"

deploy: dist
	scp -rp -P 9681 dist/* pi@sandr0.tk:~/price-logger/visualization