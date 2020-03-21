download_logs:
ifdef FROM
	scp -r ${FROM}:~/price-logger/logs/ logs/
else
	echo "Please call like this \"make download_logs FROM=pi@raspberrypi.fritz.box\""
endif

upload_logs:
ifdef TO
	scp -r logs ${TO}:~/price-logger/
else
	echo "Please call like this \"make upload_logs TO=pi@raspberrypi.fritz.box\""
endif
