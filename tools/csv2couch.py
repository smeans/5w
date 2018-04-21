#!/usr/bin/env python
import sys
import csv
import re
import time
import json
import urllib2

import argparse
import getpass
import hashlib
import base64

fieldNameRe = re.compile(r'\W')
def makeFieldNames(row):
    return [re.sub(r'\W', '', n) for n in row]

def makeDocID():
    eh = hashlib.md5(getpass.getuser().encode()).hexdigest()

    return '%s_%sT%f' % (args.object_type, eh, time.time())

def importDocs(docs):
    print('importing %d docs' % len(docs))
    data = {'docs': docs}

    req = urllib2.Request(args.url + '/_bulk_docs')
    if args.username:
        s = base64.b64encode('%s:%s' % (args.username, args.password))
        request.add_header("Authorization", "Basic %s" % s)

    req.add_header('Content-Type', 'application/json')

    resp = urllib2.urlopen(req, json.dumps(data))
    resp.read()
    if resp.code < 200 or resp.code >= 300:
        print('%s: %s' %(resp.code, resp.msg))

parser = argparse.ArgumentParser(description='Import CSV files into CouchDB.')
parser.add_argument('csvfile', nargs='?', help='Optional CSV filename. Will use stdin if missing.')
parser.add_argument('--url', required=True, help='target URL for CouchDB')
parser.add_argument('--object_type', required=True)
parser.add_argument('--batchsize', type=int, default=500, help='do bulk insert every batchsize rows')
parser.add_argument('--max_items', type=int, help='stop importing after max_items')
parser.add_argument('--username', help='CouchDB username')
parser.add_argument('--password', help='CouchDB password')

args = parser.parse_args()

with open(args.csvfile) if args.csvfile else sys.stdin as infile:
    csvreader = csv.reader(infile)
    fieldNames = None
    itemCount = 0
    docs = []

    for row in csvreader:
        if not fieldNames:
            fieldNames = makeFieldNames(row)
        else:
            itemCount += 1
            if args.max_items and itemCount >= args.max_items:
                break

            doc = dict((k, v.strip()) for k, v in zip(fieldNames, row) if v.strip())
            doc['ObjectType'] = args.object_type
            doc['_id'] = makeDocID()
            docs.append(doc)

        if len(docs) >= args.batchsize:
            importDocs(docs)
            docs = []

    if len(docs):
        importDocs(docs)
        docs = []

    doc = {'_id': '$5w_proto_' + args.object_type, 'fields': fieldNames, 'allow_create': []}
    importDocs([doc])
