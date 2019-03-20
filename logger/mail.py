import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
import time

def send_mail(mail_config, item, price):
    # Create a secure SSL context
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(mail_config['smtp_url'], mail_config['smtp_port'], context=context) as server:
        message = MIMEMultipart("alternative")
        message["Subject"] = "[Price-Logger] Alert: {}".format(item)
        message["From"] = mail_config['from']
        message["To"] = mail_config['to']

        # Create the plain-text and HTML version of your message
        text = '''Item: {}
Current price: {} €.'''.format(item, price)
        html = '<html><body>Item: {}<br/>Price: {}</body></html>'.format(item, price)

        # Turn these into plain/html MIMEText objects
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        # Add HTML/plain-text parts to MIMEMultipart message
        # The email client will try to render the last part first
        message.attach(part1)
        message.attach(part2)

        server.login(mail_config['from'], mail_config['password'])

        server.sendmail(mail_config['from'], mail_config["to"], message.as_string())
        return True

def send_error(mail_config, error):
    # Create a secure SSL context
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(mail_config['smtp_url'], mail_config['smtp_port'], context=context) as server:
        message = MIMEMultipart("alternative")
        message["Subject"] = "[Price-Logger] Error"
        message["From"] = mail_config['from']
        message["To"] = mail_config['to']

        # Create the plain-text and HTML version of your message
        text = 'Error: {}'.format(error)
        html = '<html><body>Error: {}</body></html>'.format(error)

        # Turn these into plain/html MIMEText objects
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        # Add HTML/plain-text parts to MIMEMultipart message
        # The email client will try to render the last part first
        message.attach(part1)
        message.attach(part2)

        server.login(mail_config['from'], mail_config['password'])

        server.sendmail(mail_config['from'], mail_config["to"], message.as_string())
        return True