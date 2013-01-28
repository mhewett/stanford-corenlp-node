#!/usr/bin/env bash
#
# Runs Stanford CoreNLP.
# Simple uses for xml and plain text output to files are:
#    ./corenlp.sh -file filename
#    ./corenlp.sh -file filename -outputFormat text 
#
#    ./corenlp-server.sh {stanford-corenlp-dir} options

NLP_DIR=$1
# echo "Dir is $NLP_DIR"
# Eat the parameter
shift

# classpath is the second parameter
CP=$1
# Eat one of the input parameters
shift

CLASSPATH=${CP}:${NLP_DIR}/stanford-corenlp-2012-07-09.jar:${NLP_DIR}/stanford-corenlp-2012-07-06-models.jar:${NLP_DIR}/joda-time.jar:${NLP_DIR}/xom.jar


# Run the program
echo java -Xmx3g -cp "$CLASSPATH" com.lemlabs.nlp.StanfordCoreNLPServer $*
java -Xmx3g -cp "$CLASSPATH" com.lemlabs.nlp.StanfordCoreNLPServer $*
