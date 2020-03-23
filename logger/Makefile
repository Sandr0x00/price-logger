.PHONY: install start build nohup kill

install:
	sudo pip3 install -r requirements.txt

start:
	./price-logger.py

nohup:
	@nohup ./price-logger.py &
	@printf ""
	@tail -n 2 nohup.out
	@cat pid
	@printf "\n"

kill:
	@kill `cat pid`
	@ps -ef | grep "[p]rice-logger"

status:
	@ps -ef | grep "[p]rice-logger"

restart: kill nohup

deploy:
ifdef TO
	scp Makefile ${TO}:~/price-logger/logger
	scp price-logger.py ${TO}:~/price-logger/logger
	scp mail.py ${TO}:~/price-logger/logger
	scp config.json ${TO}:~/price-logger/logger
else
	echo "Please call like this \"make deploy TO=pi@raspberrypi.fritz.box\""
endif

deploy-config:
ifdef TO
	scp config.json ${TO}:~/price-logger/logger
else
	echo "Please call like this \"make deploy-config TO=pi@raspberrypi.fritz.box\""
endif

deploy-restart:
	ssh -t ${TO} 'cd ~/price-logger/logger && make restart'