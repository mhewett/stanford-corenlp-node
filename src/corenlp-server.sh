#!/usr/bin/env bash
#
# Runs Stanford CoreNLP.
# Simple uses for xml and plain text output to files are:
#    ./corenlp-server.sh nlpDir nlpFiles classpath 
#    ./corenlp-server.sh
#
#    ./corenlp-server.sh {stanford-corenlp-dir} options

# NLP directory is the first argument
NLP_DIR=$1
shift
# echo "Dir is $NLP_DIR"

# NLP libraries is the second argument.  They should have a colon between each entry
NLP_LIBS=$1
shift

# classpath is the third argument
CP=$1
shift

CLASSPATH=${CP}

# Add NLP libraries to the classpath
# Set the Internal Field Separator to ':', remembering the old one
OLD_IFS=$IFS
IFS=':'

for lib in ${NLP_LIBS} 
do
  CLASSPATH=${CLASSPATH}:$NLP_DIR/$lib
done
IFS=$OLD_IFS

# echo the classpath
echo "CLASSPATH is ${CLASSPATH}"


# Run the program
echo java -Xmx3g -cp "$CLASSPATH" com.lemlabs.nlp.StanfordCoreNLPServer $*
java -Xmx3g -cp "$CLASSPATH" com.lemlabs.nlp.StanfordCoreNLPServer $*
