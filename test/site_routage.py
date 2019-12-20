#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask, g, request, session, render_template, Response, abort
from urllib2 import urlopen, Request, HTTPError
from urllib import urlencode

app = Flask(__name__,
            static_url_path = '/src',
            static_folder = "../src")
app.debug = True

FDSNWS_HOST = 'http://encelade.unice.fr:8000'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fdsnws/', defaults={'path': ''})
@app.route('/fdsnws/<path:path>', methods=['GET', 'POST'])
def fdsnws(path):
    url = '/'.join([FDSNWS_HOST, 'fdsnws', path])
    if request.method == 'GET':
        response = urlopen('%s?%s' % (url, urlencode(request.args.to_dict(flat=True))))
    elif request.method == 'POST':
        r = Request(url, data=request.data, headers={'Content-Type': request.headers['Content-Type']})
        response = urlopen(r)
    result = response.read()
    return Response(result, mimetype=response.headers.type)

if __name__ == '__main__':
    app.run('0.0.0.0', port=8000)
